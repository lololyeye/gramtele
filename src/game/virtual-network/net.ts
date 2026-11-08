/**
 * The simulated internet. Every lookup and request is answered from in-memory
 * registries. This module has no access to fetch, sockets, or anything else that
 * could leave the page, and it refuses any address outside the game's registry.
 */
import type { DnsRecord, DnsType, SiteEnv, VHost, VRequest, VResponse, VSite, WhoisRecord } from './types';
import { STATUS_TEXT } from './types';

export interface NetRegistry {
  hosts: VHost[];
  dns: DnsRecord[];
  sites: VSite[];
  whois: WhoisRecord[];
}

export interface DnsAnswer {
  status: 'NOERROR' | 'NXDOMAIN';
  answers: DnsRecord[];
}

export interface FetchInput {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  files?: VRequest['files'];
  via: VRequest['via'];
}

export interface FetchResult {
  ok: boolean;
  error?: string;
  host?: string;
  ip?: string;
  scheme?: 'http' | 'https';
  port?: number;
  path?: string;
  status?: number;
  statusText?: string;
  headers?: [string, string][];
  body?: string;
  tag?: string;
  site?: VSite;
  requestHeaders?: [string, string][];
  method?: string;
}

export type NetEvent =
  | { t: 'dns'; name: string; type: DnsType }
  | { t: 'http'; host: string; path: string; method: string; status: number; via: string; flags: string[] }
  | { t: 'probe'; kind: 'ping' | 'traceroute' | 'nmap' | 'whois'; target: string };

const norm = (n: string) => n.toLowerCase().replace(/\.$/, '');

export function isIp(s: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
}

export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => ((acc << 8) | Number(o)) >>> 0, 0);
}

export function inCidr(ip: string, cidr: string): boolean {
  const [base, bitsRaw] = cidr.split('/');
  const bits = Number(bitsRaw ?? 32);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(base) & mask);
}

export class VirtualNet {
  constructor(
    private reg: NetRegistry,
    private env: SiteEnv,
    private emit: (e: NetEvent) => void,
    private cookieJar: { get: (host: string) => Record<string, string> },
  ) {}

  get hosts(): VHost[] {
    return this.reg.hosts;
  }

  dns(nameRaw: string, type: DnsType): DnsAnswer {
    const name = norm(nameRaw);
    this.emit({ t: 'dns', name, type });
    const answers: DnsRecord[] = [];
    const seen = new Set<string>();
    let cur = name;
    for (let i = 0; i < 8; i++) {
      if (seen.has(cur)) break;
      seen.add(cur);
      const direct = this.reg.dns.filter((r) => r.name === cur && r.type === type);
      if (direct.length) {
        answers.push(...direct);
        return { status: 'NOERROR', answers };
      }
      const cname = this.reg.dns.find((r) => r.name === cur && r.type === 'CNAME');
      if (!cname) break;
      answers.push(cname);
      cur = norm(cname.value);
    }
    const existsAtAll = this.reg.dns.some((r) => r.name === name);
    return { status: answers.length || existsAtAll ? 'NOERROR' : 'NXDOMAIN', answers };
  }

  ptr(ip: string): string | null {
    return this.reg.hosts.find((h) => h.ip === ip)?.ptr ?? null;
  }

  /** Silent resolution used by the tools themselves. */
  resolve(target: string): string | null {
    const t = norm(target);
    if (isIp(t)) return this.reg.hosts.some((h) => h.ip === t) ? t : null;
    let cur = t;
    for (let i = 0; i < 8; i++) {
      const a = this.reg.dns.find((r) => r.name === cur && r.type === 'A');
      if (a) return a.value;
      const c = this.reg.dns.find((r) => r.name === cur && r.type === 'CNAME');
      if (!c) return null;
      cur = norm(c.value);
    }
    return null;
  }

  hostByIp(ip: string): VHost | undefined {
    return this.reg.hosts.find((h) => h.ip === ip);
  }

  hostFor(target: string): VHost | undefined {
    const ip = this.resolve(target);
    return ip ? this.hostByIp(ip) : undefined;
  }

  whois(domainRaw: string): WhoisRecord | null {
    const domain = norm(domainRaw);
    this.emit({ t: 'probe', kind: 'whois', target: domain });
    return this.reg.whois.find((w) => w.domain === domain) ?? null;
  }

  noteProbe(kind: 'ping' | 'traceroute' | 'nmap', target: string): void {
    this.emit({ t: 'probe', kind, target: norm(target) });
  }

  async fetch(input: FetchInput): Promise<FetchResult> {
    let url: URL;
    try {
      const raw = /^[a-z]+:\/\//i.test(input.url) ? input.url : `http://${input.url}`;
      url = new URL(raw);
    } catch {
      return { ok: false, error: 'malformed URL' };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, error: `Protocol "${url.protocol.replace(':', '')}" not supported` };
    const hostName = norm(url.hostname);
    const ip = this.resolve(hostName);
    if (!ip) return { ok: false, host: hostName, error: `Could not resolve host: ${hostName}` };
    const vhost = this.hostByIp(ip)!;
    const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
    const svc = vhost.services.find((s) => s.port === port && s.proto === 'tcp');
    if (!svc || svc.filtered) return { ok: false, host: hostName, ip, port, error: `Failed to connect to ${hostName} port ${port}: Connection refused` };
    const site = this.reg.sites.find((s) => s.host === hostName) ?? this.reg.sites.find((s) => this.resolve(s.host) === ip);
    const scheme = url.protocol === 'https:' ? 'https' : 'http';
    if (!site) return { ok: false, host: hostName, ip, port, error: `Empty reply from server` };

    const method = (input.method ?? 'GET').toUpperCase();
    const headers: Record<string, string> = { host: hostName, accept: '*/*' };
    for (const [k, v] of Object.entries(input.headers ?? {})) headers[k.toLowerCase()] = v;
    if (!headers['user-agent']) {
      headers['user-agent'] = input.via === 'browser' ? 'Mozilla/5.0 (X11; Linux x86_64) gt-workbench/1.4' : input.via === 'wget' ? 'Wget/1.21.4' : 'curl/8.5.0';
    }
    const cookies: Record<string, string> = {};
    if (input.via === 'browser') Object.assign(cookies, this.cookieJar.get(hostName));
    if (headers.cookie) {
      for (const part of headers.cookie.split(';')) {
        const i = part.indexOf('=');
        if (i > 0) cookies[part.slice(0, i).trim()] = part.slice(i + 1).trim();
      }
    } else if (input.via === 'browser' && Object.keys(cookies).length) {
      headers.cookie = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    const body = input.body ?? '';
    const contentType = headers['content-type'] ?? '';
    const req: VRequest = {
      method,
      host: hostName,
      path: decodeURI(url.pathname) || '/',
      query: url.searchParams,
      headers,
      body,
      cookies,
      form: new URLSearchParams(contentType.includes('urlencoded') || !contentType ? body : ''),
      files: input.files ?? [],
      scheme,
      via: input.via,
    };
    let res: VResponse;
    try {
      res = await site.handle(req, this.env);
    } catch (e) {
      res = { status: 500, headers: [['Content-Type', 'text/plain']], body: `Internal Server Error\n` };
      void e;
    }
    const merged: [string, string][] = [['Date', new Date(this.env.now()).toUTCString()], ...(site.headers ?? []), ...res.headers];
    if (!merged.some(([k]) => k.toLowerCase() === 'content-length')) merged.push(['Content-Length', String(res.body.length)]);
    this.emit({ t: 'http', host: hostName, path: req.path, method, status: res.status, via: input.via, flags: [] });
    return {
      ok: true,
      host: hostName,
      ip,
      scheme,
      port,
      path: url.pathname + url.search,
      status: res.status,
      statusText: STATUS_TEXT[res.status] ?? 'Unknown',
      headers: merged,
      body: res.body,
      tag: res.tag,
      site,
      method,
      requestHeaders: Object.entries(headers).map(([k, v]) => [k.replace(/(^|-)([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase()), v]),
    };
  }
}

// ---------- static site helpers ----------

export interface StaticPage {
  body: string;
  type?: string;
  status?: number;
  headers?: [string, string][];
  tag?: string;
}

export function html(body: string, headers: [string, string][] = []): VResponse {
  return { status: 200, headers: [['Content-Type', 'text/html; charset=utf-8'], ...headers], body };
}

export function text(status: number, body: string, headers: [string, string][] = []): VResponse {
  return { status, headers: [['Content-Type', 'text/plain; charset=utf-8'], ...headers], body };
}

export function redirect(location: string, headers: [string, string][] = []): VResponse {
  return { status: 302, headers: [['Location', location], ...headers], body: '' };
}

const NOT_FOUND = `<!doctype html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>\n`;

export function staticSite(host: string, pages: Record<string, StaticPage>, opts: { headers?: [string, string][]; cert?: VSite['cert'] } = {}): VSite & { pages: Record<string, StaticPage> } {
  return {
    pages,
    host,
    headers: opts.headers,
    cert: opts.cert,
    handle(req) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return { status: 405, headers: [['Allow', 'GET, HEAD'], ['Content-Type', 'text/plain']], body: 'Method Not Allowed\n' };
      const page = pages[req.path] ?? pages[req.path.replace(/\/$/, '')] ?? pages[`${req.path}/`];
      if (!page) return { status: 404, headers: [['Content-Type', 'text/html']], body: NOT_FOUND };
      return {
        status: page.status ?? 200,
        headers: [['Content-Type', page.type ?? 'text/html; charset=utf-8'], ...(page.headers ?? [])],
        body: page.body,
        tag: page.tag,
      };
    },
  };
}
