import { FileNode } from '../filesystem/vfs';
import type { CmdCtx, Command } from '../terminal/types';
import { FetchResult, inCidr, ipToInt, isIp, VirtualNet } from '../virtual-network/net';
import type { DnsType } from '../virtual-network/types';
import { pad, padEnd, parseArgs } from './args';
import { manual } from './manual';

function net(ctx: CmdCtx): VirtualNet {
  return ctx.sh.host.services.net as VirtualNet;
}

const LOCAL_IP = '10.40.0.47';
const GATEWAY = '10.40.0.1';

/** Stable pseudo-random jitter so latencies look natural but tests stay deterministic. */
function jitter(seed: string, i: number): number {
  let h = 2166136261;
  for (const c of seed + i) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const unreachable = (target: string) => `${target}: Name or service not known (the lab resolver only knows simulated .test and lab hosts)`;

const ping: Command = {
  name: 'ping',
  tool: 'net',
  man: manual('ping', ['ping [-c COUNT] HOST']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { values: 'cWwi', flags: 'nq' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const target = a.rest[0];
    if (!target) return ctx.fail('usage error: Destination address required', 2);
    const n = net(ctx);
    const count = Math.min(Number(a.values.c ?? 4), 20);
    const ip = n.resolve(target);
    n.noteProbe('ping', target);
    if (!ip) return ctx.fail(unreachable(target), 2);
    const host = n.hostByIp(ip)!;
    ctx.line(`PING ${target} (${ip}) 56(84) bytes of data.`);
    if (host.noPing) {
      ctx.line('');
      ctx.line(`--- ${target} ping statistics ---`);
      ctx.line(`${count} packets transmitted, 0 received, 100% packet loss, time ${count * 1000 - 1000 + 12}ms`);
      ctx.line('');
      return 1;
    }
    const ttl = 64 - host.path.length - 1;
    const times: number[] = [];
    for (let i = 0; i < count; i++) {
      const t = host.latency + jitter(ip, i) * host.latency * 0.2;
      times.push(t);
      ctx.line(`64 bytes from ${ip}: icmp_seq=${i + 1} ttl=${ttl} time=${t.toFixed(1)} ms`);
    }
    const avg = times.reduce((s, t) => s + t, 0) / count;
    ctx.line('');
    ctx.line(`--- ${target} ping statistics ---`);
    ctx.line(`${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000 - 1000 + 3}ms`);
    ctx.line(`rtt min/avg/max = ${Math.min(...times).toFixed(3)}/${avg.toFixed(3)}/${Math.max(...times).toFixed(3)} ms`);
    return 0;
  },
};

const traceroute: Command = {
  name: 'traceroute',
  tool: 'net',
  man: manual('traceroute', ['traceroute HOST']),
  run(ctx) {
    const target = ctx.argv[1];
    if (!target) return ctx.fail('usage: traceroute HOST', 2);
    const n = net(ctx);
    const ip = n.resolve(target);
    n.noteProbe('traceroute', target);
    if (!ip) return ctx.fail(unreachable(target), 2);
    const host = n.hostByIp(ip)!;
    ctx.line(`traceroute to ${target} (${ip}), 30 hops max, 60 byte packets`);
    const hops = [...host.path, host.name];
    let cumulative = 0.8;
    hops.forEach((hopName, i) => {
      const hop = n.hosts.find((h) => h.name === hopName);
      cumulative += Math.max(0.4, (host.latency / hops.length) * (0.7 + jitter(hopName, 0)));
      if (!hop) {
        ctx.line(`${pad(i + 1, 2)}  * * *`);
        return;
      }
      const r = (k: number) => (cumulative + jitter(hopName, k) * 0.6).toFixed(3);
      ctx.line(`${pad(i + 1, 2)}  ${hop.name} (${hop.ip})  ${r(1)} ms  ${r(2)} ms  ${r(3)} ms`);
    });
    return 0;
  },
};

const ip: Command = {
  name: 'ip',
  tool: 'net',
  man: manual('ip', ['ip addr', 'ip a', 'ip route', 'ip r']),
  run(ctx) {
    const sub = ctx.argv[1] ?? '';
    const local = localIp(ctx);
    if ('addr'.startsWith(sub) && sub) {
      ctx.line('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN');
      ctx.line('    inet 127.0.0.1/8 scope host lo');
      ctx.line('2: wg0: <POINTOPOINT,NOARP,UP,LOWER_UP> mtu 1420 qdisc noqueue state UNKNOWN');
      ctx.line(`    inet ${local}/24 scope global wg0`);
      return 0;
    }
    if ('route'.startsWith(sub) && sub) {
      ctx.line(`default via ${GATEWAY} dev wg0`);
      ctx.line(`10.40.0.0/24 dev wg0 proto kernel scope link src ${local}`);
      return 0;
    }
    return ctx.fail(sub ? `Object "${sub}" is unknown, try "ip help".` : 'usage: ip { addr | route }', 1);
  },
};

function localIp(_ctx: CmdCtx): string {
  return LOCAL_IP;
}

const ss: Command = {
  name: 'ss',
  tool: 'net',
  man: manual('ss', ['ss -tuln', 'ss -tan']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'tulnapH' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const local = localIp(ctx);
    const rows: [string, string, string, string, string][] = [
      ['tcp', 'LISTEN', '127.0.0.1:631', '0.0.0.0:*', 'cupsd'],
      ['tcp', 'LISTEN', '0.0.0.0:22', '0.0.0.0:*', 'sshd'],
      ['tcp', 'LISTEN', '127.0.0.1:9417', '0.0.0.0:*', 'gt-relayd'],
      ['tcp', 'ESTAB', `${local}:51944`, '203.0.113.21:443', 'gt-relayd'],
      ['udp', 'UNCONN', '0.0.0.0:51820', '0.0.0.0:*', 'wireguard'],
      ['udp', 'UNCONN', '127.0.0.53:53', '0.0.0.0:*', 'resolved'],
    ];
    const f = a.flags;
    const shown = rows.filter((r) => {
      if (f.has('t') && !f.has('u') && r[0] !== 'tcp') return false;
      if (f.has('u') && !f.has('t') && r[0] !== 'udp') return false;
      if (f.has('l') && r[1] === 'ESTAB') return false;
      if (!f.has('l') && !f.has('a') && r[1] !== 'ESTAB') return false;
      return true;
    });
    ctx.line(`${padEnd('Netid', 6)} ${padEnd('State', 8)} ${padEnd('Local Address:Port', 24)} ${padEnd('Peer Address:Port', 24)}${f.has('p') ? ' Process' : ''}`);
    for (const r of shown) ctx.line(`${padEnd(r[0], 6)} ${padEnd(r[1], 8)} ${padEnd(r[2], 24)} ${padEnd(r[3], 24)}${f.has('p') ? ` users:(("${r[4]}"))` : ''}`);
    return 0;
  },
};

const DNS_TYPES: DnsType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'PTR'];

const dig: Command = {
  name: 'dig',
  tool: 'net',
  man: manual('dig', ['dig NAME [TYPE] [+short]', 'dig -x IP']),
  run(ctx) {
    const args = ctx.argv.slice(1);
    const short = args.includes('+short');
    const rest = args.filter((s) => !s.startsWith('+'));
    const n = net(ctx);
    let name = '';
    let type: DnsType = 'A';
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      if (a === '-x') {
        const ipv = rest[++i];
        if (!ipv || !isIp(ipv)) return ctx.fail('Invalid IP address');
        name = ipv.split('.').reverse().join('.') + '.in-addr.arpa';
        type = 'PTR';
        const ptr = n.ptr(ipv);
        n.dns(name, 'PTR');
        if (short) {
          if (ptr) ctx.line(`${ptr}.`);
          return 0;
        }
        header(ctx, name, 'PTR', ptr ? 'NOERROR' : 'NXDOMAIN', ptr ? 1 : 0);
        if (ptr) {
          ctx.line(';; ANSWER SECTION:');
          ctx.line(`${padEnd(name + '.', 32)} 3600 IN PTR ${ptr}.`);
          ctx.line('');
        }
        return footer(ctx);
      }
      if (a.startsWith('@')) continue;
      if (DNS_TYPES.includes(a.toUpperCase() as DnsType) && name) type = a.toUpperCase() as DnsType;
      else if (!name) name = a;
      else return ctx.fail(`Invalid option: ${a}`);
    }
    if (!name) return ctx.fail('usage: dig NAME [TYPE] [+short]');
    const res = n.dns(name, type);
    if (short) {
      for (const r of res.answers) ctx.line(r.type === 'A' || r.type === 'TXT' ? (r.type === 'TXT' ? `"${r.value}"` : r.value) : `${r.value}.`);
      return 0;
    }
    header(ctx, name, type, res.status, res.answers.length);
    if (res.answers.length) {
      ctx.line(';; ANSWER SECTION:');
      for (const r of res.answers) {
        const val = r.type === 'TXT' ? `"${r.value}"` : r.type === 'A' ? r.value : `${r.value}.`;
        ctx.line(`${padEnd(r.name + '.', 32)} ${r.ttl ?? 3600} IN ${padEnd(r.type, 5)} ${val}`);
      }
      ctx.line('');
    }
    return footer(ctx);
  },
};

function header(ctx: CmdCtx, name: string, type: string, status: string, answers: number): void {
  ctx.line(`; <<>> DiG 9.18.28 <<>> ${name} ${type}`);
  ctx.line(';; global options: +cmd');
  ctx.line(`;; ->>HEADER<<- opcode: QUERY, status: ${status}, id: ${40000 + (name.length * 373) % 9999}`);
  ctx.line(`;; flags: qr rd ra; QUERY: 1, ANSWER: ${answers}, AUTHORITY: 0, ADDITIONAL: 1`);
  ctx.line('');
  ctx.line(';; QUESTION SECTION:');
  ctx.line(`;${padEnd(name + '.', 31)}      IN ${type}`);
  ctx.line('');
}
function footer(ctx: CmdCtx): number {
  ctx.line(`;; Query time: 11 msec`);
  ctx.line(`;; SERVER: 10.40.0.1#53(10.40.0.1) (UDP)`);
  ctx.line(`;; WHEN: ${new Date(ctx.sh.host.now()).toUTCString()}`);
  return 0;
}

const host: Command = {
  name: 'host',
  tool: 'net',
  man: manual('host', ['host NAME']),
  run(ctx) {
    const name = ctx.argv[1];
    if (!name) return ctx.fail('usage: host NAME');
    const n = net(ctx);
    const a = n.dns(name, 'A');
    if (a.status === 'NXDOMAIN') {
      ctx.line(`Host ${name} not found: 3(NXDOMAIN)`);
      return 1;
    }
    for (const r of a.answers) {
      if (r.type === 'CNAME') ctx.line(`${r.name} is an alias for ${r.value}.`);
      else ctx.line(`${r.name} has address ${r.value}`);
    }
    for (const r of n.dns(name, 'MX').answers) if (r.type === 'MX') ctx.line(`${r.name} mail is handled by ${r.value}.`);
    return 0;
  },
};

const whois: Command = {
  name: 'whois',
  tool: 'osint',
  man: manual('whois', ['whois DOMAIN']),
  run(ctx) {
    const d = ctx.argv[1];
    if (!d) return ctx.fail('usage: whois DOMAIN');
    const rec = net(ctx).whois(d);
    if (!rec) {
      ctx.line(`No match for "${d.toUpperCase()}".`);
      return 1;
    }
    ctx.line(`Domain Name: ${rec.domain.toUpperCase()}`);
    for (const [k, v] of rec.fields) ctx.line(`${k}: ${v}`);
    ctx.line('>>> Registry data is simulated within the laboratory. <<<');
    return 0;
  },
};

const nmap: Command = {
  name: 'nmap',
  tool: 'net',
  man: manual('nmap', ['nmap [-sV] [-p PORTS] TARGET', 'nmap -sn 10.40.0.0/24']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'nvT', values: 'ps', long: {} });
    const target = a.rest[0];
    const scanType = a.values.s ?? '';
    if (!target) return ctx.fail('usage: nmap [-sV] [-sn] [-p PORTS] TARGET');
    const n = net(ctx);
    n.noteProbe('nmap', target);
    ctx.line(`Starting Nmap 7.94 ( lab simulation ) at ${new Date(ctx.sh.host.now()).toISOString().slice(0, 16).replace('T', ' ')} UTC`);
    const targets = target.includes('/')
      ? n.hosts.filter((h) => isIp(h.ip) && safeInCidr(h.ip, target))
      : (() => {
          const h = n.hostFor(target);
          return h ? [h] : [];
        })();
    if (!targets.length) {
      if (!target.includes('/') && !n.resolve(target)) {
        ctx.line(`Failed to resolve "${target}".`);
        ctx.line('WARNING: No targets were specified, so 0 hosts scanned.');
        ctx.line('(This lab tool refuses any target that is not part of the simulation.)');
        return 1;
      }
      ctx.line(`Nmap done: ${target} scanned, 0 hosts up`);
      return 0;
    }
    const sorted = [...targets].sort((x, y) => ipToInt(x.ip) - ipToInt(y.ip));
    const ports = a.values.p ? expandPorts(a.values.p) : null;
    for (const h of sorted) {
      ctx.line(`Nmap scan report for ${h.name} (${h.ip})`);
      ctx.line(`Host is up (0.0${Math.round(h.latency)}s latency).`);
      if (scanType === 'n') continue;
      const visible = h.services.filter((s) => s.proto === 'tcp' && (!ports || ports.has(s.port)));
      if (!visible.length) {
        ctx.line('All scanned ports are closed.');
        ctx.line('');
        continue;
      }
      ctx.line(`${padEnd('PORT', 9)} ${padEnd('STATE', 9)} ${padEnd('SERVICE', 12)}${scanType === 'V' ? ' VERSION' : ''}`);
      for (const s of visible) {
        ctx.line(`${padEnd(`${s.port}/${s.proto}`, 9)} ${padEnd(s.filtered ? 'filtered' : 'open', 9)} ${padEnd(s.name, 12)}${scanType === 'V' && !s.filtered ? ` ${s.version ?? ''}` : ''}`);
      }
      ctx.line('');
    }
    ctx.line(`Nmap done: ${target.includes('/') ? `256 IP addresses (${sorted.length} hosts up)` : '1 IP address (1 host up)'} scanned in 2.1${sorted.length} seconds`);
    return 0;
  },
};

function safeInCidr(ip: string, cidr: string): boolean {
  try {
    return inCidr(ip, cidr);
  } catch {
    return false;
  }
}

function expandPorts(spec: string): Set<number> {
  const out = new Set<number>();
  for (const p of spec.split(',')) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(p);
    if (!m) continue;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    for (let i = from; i <= Math.min(to, 65535); i++) out.add(i);
  }
  return out;
}

// ---------- HTTP clients ----------

function formatHeaders(r: FetchResult): string {
  let s = `HTTP/1.1 ${r.status} ${r.statusText}\n`;
  for (const [k, v] of r.headers ?? []) s += `${k}: ${v}\n`;
  return s + '\n';
}

function saveTo(ctx: CmdCtx, path: string, r: FetchResult): void {
  const p = ctx.sh.resolvePath(path);
  ctx.fs.write(p, r.body ?? '', ctx.id);
  if (r.tag) (ctx.fs.stat(p, ctx.id) as FileNode).tag = r.tag;
}

const curl: Command = {
  name: 'curl',
  tool: 'osint',
  man: manual('curl', ['curl [OPTIONS] URL']),
  async run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), {
      flags: 'iIvLsSOkfGg',
      values: 'oXdHbcAFuTm',
      long: {
        include: 'i',
        head: 'I',
        verbose: 'v',
        location: 'L',
        silent: 's',
        'show-error': 'S',
        insecure: 'k',
        fail: 'f',
        get: 'G',
        'output=': 'o',
        'request=': 'X',
        'data=': 'd',
        'data-raw=': 'd',
        'data-urlencode=': 'U',
        'header=': 'H',
        'cookie=': 'b',
        'cookie-jar=': 'c',
        'user-agent=': 'A',
        'form=': 'F',
        'url=': 'Z',
        'max-time=': 'm',
      },
    });
    if (a.unknown) return ctx.fail(`option ${a.unknown}: is unknown\ncurl: try 'man curl' for more information`, 2);
    const url = a.values.Z ?? a.rest[0];
    if (!url) return ctx.fail('no URL specified!\ncurl: try \'man curl\' for more information', 2);
    const f = a.flags;
    const n = net(ctx);
    const headers: Record<string, string> = {};
    for (const h of a.multi.H ?? []) {
      const i = h.indexOf(':');
      if (i > 0) headers[h.slice(0, i).trim().toLowerCase()] = h.slice(i + 1).trim();
    }
    if (a.values.A) headers['user-agent'] = a.values.A;
    if (a.values.b) {
      const v = a.values.b;
      if (v.includes('=')) headers.cookie = v;
      else {
        try {
          headers.cookie = parseCookieFile(ctx.fs.read(ctx.sh.resolvePath(v), ctx.id));
        } catch {
          /* curl treats a missing cookie file as an empty jar */
        }
      }
    }
    const dataParts: string[] = [...(a.multi.d ?? [])];
    for (const u of a.multi.U ?? []) {
      const i = u.indexOf('=');
      dataParts.push(i >= 0 ? `${u.slice(0, i)}=${encodeURIComponent(u.slice(i + 1))}` : encodeURIComponent(u));
    }
    for (let i = 0; i < dataParts.length; i++) {
      if (dataParts[i].startsWith('@')) {
        try {
          dataParts[i] = ctx.fs.read(ctx.sh.resolvePath(dataParts[i].slice(1)), ctx.id).trim();
        } catch (e) {
          return ctx.fail(`Failed to open/read local data from file/application: ${(e as Error).message}`, 26);
        }
      }
    }
    let body = dataParts.length ? dataParts.join('&') : undefined;
    let method = a.values.X ?? (f.has('I') ? 'HEAD' : body !== undefined ? 'POST' : 'GET');
    const files: { field: string; filename: string; content: string }[] = [];
    const formFields: string[] = [];
    for (const spec of a.multi.F ?? []) {
      const m = /^([^=]+)=(@?)(.*)$/.exec(spec);
      if (!m) return ctx.fail('Illegally formatted input field!', 2);
      if (m[2] === '@') {
        const path = m[3].split(';')[0];
        try {
          files.push({ field: m[1], filename: path.split('/').pop()!, content: ctx.fs.read(ctx.sh.resolvePath(path), ctx.id) });
        } catch (e) {
          return ctx.fail(`Failed to open/read local data from file/application: ${(e as Error).message}`, 26);
        }
      } else formFields.push(`${m[1]}=${encodeURIComponent(m[3])}`);
    }
    if (files.length || formFields.length) {
      method = a.values.X ?? 'POST';
      headers['content-type'] = 'multipart/form-data; boundary=gt';
      body = formFields.join('&');
    } else if (body !== undefined && !headers['content-type']) {
      headers['content-type'] = 'application/x-www-form-urlencoded';
    }
    let cur = url;
    let res: FetchResult;
    let hops = 0;
    let out = '';
    for (;;) {
      res = await n.fetch({ url: cur, method, headers, body, files, via: 'curl' });
      if (!res.ok) {
        if (!f.has('s') || f.has('S')) ctx.err(`curl: (${res.error?.startsWith('Could not') ? 6 : 7}) ${res.error}\n`);
        return res.error?.startsWith('Could not') ? 6 : 7;
      }
      if (f.has('v')) {
        const v: string[] = [];
        v.push(`*   Trying ${res.ip}:${res.port}...`);
        v.push(`* Connected to ${res.host} (${res.ip}) port ${res.port}`);
        if (res.scheme === 'https' && res.site?.cert) {
          v.push(`* TLSv1.3 (OUT), TLS handshake, Client hello (1):`);
          v.push(`* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384`);
          v.push(`* Server certificate:`);
          v.push(`*  subject: ${res.site.cert.subject}`);
          v.push(`*  expire date: ${res.site.cert.notAfter}`);
          v.push(`*  issuer: ${res.site.cert.issuer}`);
        }
        v.push(`> ${res.method} ${res.path} HTTP/1.1`);
        for (const [k, val] of res.requestHeaders ?? []) v.push(`> ${k}: ${val}`);
        v.push('>');
        v.push(`< HTTP/1.1 ${res.status} ${res.statusText}`);
        for (const [k, val] of res.headers ?? []) v.push(`< ${k}: ${val}`);
        v.push('<');
        ctx.err(v.join('\n') + '\n');
      }
      if (f.has('i') || f.has('I')) out += formatHeaders(res);
      if (a.values.c) saveCookies(ctx, a.values.c, res);
      const loc = res.headers?.find(([k]) => k.toLowerCase() === 'location')?.[1];
      if (f.has('L') && loc && res.status! >= 300 && res.status! < 400 && hops++ < 10) {
        cur = loc.startsWith('http') ? loc : `${res.scheme}://${res.host}${loc}`;
        method = method === 'POST' ? 'GET' : method;
        body = undefined;
        continue;
      }
      break;
    }
    if (f.has('f') && res.status! >= 400) {
      if (!f.has('s')) ctx.err(`curl: (22) The requested URL returned error: ${res.status}\n`);
      return 22;
    }
    const saveAs = a.values.o ?? (f.has('O') ? (res.path ?? '').split('?')[0].split('/').pop() || 'index.html' : null);
    if (saveAs) {
      try {
        if (saveAs !== '/dev/null') saveTo(ctx, saveAs, res);
      } catch (e) {
        return ctx.fail(`(23) Failure writing output to destination: ${(e as Error).message}`, 23);
      }
      ctx.out(out);
      return 0;
    }
    ctx.out(out);
    if (!f.has('I')) ctx.out(res.body ?? '');
    return 0;
  },
};

function parseCookieFile(text: string): string {
  const pairs: string[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || (line.startsWith('#') && !line.startsWith('#HttpOnly_'))) continue;
    const parts = line.split('\t');
    if (parts.length >= 7) pairs.push(`${parts[5]}=${parts[6]}`);
  }
  return pairs.join('; ');
}

function saveCookies(ctx: CmdCtx, jar: string, res: FetchResult): void {
  const set = (res.headers ?? []).filter(([k]) => k.toLowerCase() === 'set-cookie');
  let content = '# Netscape HTTP Cookie File\n';
  for (const [, v] of set) {
    const [pair, ...attrs] = v.split(';');
    const i = pair.indexOf('=');
    const httpOnly = attrs.some((x) => x.trim().toLowerCase() === 'httponly');
    content += `${httpOnly ? '#HttpOnly_' : ''}${res.host}\tFALSE\t/\tFALSE\t0\t${pair.slice(0, i).trim()}\t${pair.slice(i + 1).trim()}\n`;
  }
  try {
    ctx.fs.write(ctx.sh.resolvePath(jar), content, ctx.id);
  } catch (e) {
    ctx.fail(`${jar}: ${(e as Error).message}`);
  }
}

const wget: Command = {
  name: 'wget',
  tool: 'osint',
  man: manual('wget', ['wget [-q] [-O FILE] URL']),
  async run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'q', values: 'OP' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const url = a.rest[0];
    if (!url) return ctx.fail('missing URL');
    const q = a.flags.has('q');
    const n = net(ctx);
    let cur = url;
    let r: FetchResult;
    let hops = 0;
    for (;;) {
      r = await n.fetch({ url: cur, via: 'wget' });
      if (!r.ok) {
        if (!q) ctx.err(`wget: unable to resolve host address or connect: ${r.error}\n`);
        return 4;
      }
      const loc = r.headers?.find(([k]) => k.toLowerCase() === 'location')?.[1];
      if (loc && r.status! >= 300 && r.status! < 400 && hops++ < 10) {
        cur = loc.startsWith('http') ? loc : `http://${r.host}${loc}`;
        continue;
      }
      break;
    }
    if (!q) {
      ctx.err(`Resolving ${r.host}... ${r.ip}\nConnecting to ${r.host}|${r.ip}|:${r.port}... connected.\nHTTP request sent, awaiting response... ${r.status} ${r.statusText}\n`);
    }
    if (r.status! >= 400) {
      if (!q) ctx.err(`ERROR ${r.status}: ${r.statusText}.\n`);
      return 8;
    }
    const name = a.values.O ?? ((r.path ?? '').split('?')[0].split('/').pop() || 'index.html');
    try {
      saveTo(ctx, name, r);
    } catch (e) {
      return ctx.fail(`${name}: ${(e as Error).message}`, 3);
    }
    if (!q) ctx.err(`Saving to: '${name}'\n\n'${name}' saved [${(r.body ?? '').length}]\n`);
    return 0;
  },
};

export const networkCommands: Command[] = [ping, traceroute, ip, ss, dig, host, whois, nmap, curl, wget];
