export interface VService {
  port: number;
  proto: 'tcp' | 'udp';
  name: string;
  version?: string;
  /** Hidden from a scan unless this flag is set (filtered). */
  filtered?: boolean;
}

export interface VHost {
  name: string;
  ip: string;
  services: VService[];
  /** Host names of intermediate routers from the lab gateway onward. */
  path: string[];
  /** Round-trip latency base in ms. */
  latency: number;
  /** Drops ICMP, as many real hosts do. */
  noPing?: boolean;
  /** Reverse DNS. */
  ptr?: string;
}

export type DnsType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA' | 'PTR';

export interface DnsRecord {
  name: string;
  type: DnsType;
  value: string;
  ttl?: number;
}

export interface WhoisRecord {
  domain: string;
  fields: [string, string][];
}

export interface VRequest {
  method: string;
  host: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
  body: string;
  cookies: Record<string, string>;
  form: URLSearchParams;
  /** multipart uploads resolved from the VFS */
  files: { field: string; filename: string; content: string }[];
  scheme: 'http' | 'https';
  via: 'curl' | 'wget' | 'browser';
}

export interface VResponse {
  status: number;
  headers: [string, string][];
  body: string;
  /** Evidence tag copied onto the file when saved with -o. */
  tag?: string;
}

/** What site handlers may reach in the game. */
export interface SiteEnv {
  flag: (name: string) => boolean;
  signal: (id: string) => void;
  now: () => number;
  /** Mutable per-site persistent store (guestbook entries). */
  store: Record<string, unknown>;
  handle: () => string;
}

export interface VSite {
  host: string;
  /** Default response headers, e.g. Server. */
  headers?: [string, string][];
  /** TLS certificate shown by curl -v; absence means plain HTTP only. */
  cert?: { subject: string; issuer: string; notAfter: string };
  handle: (req: VRequest, env: SiteEnv) => VResponse | Promise<VResponse>;
}

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};
