/** Small getopt: short flags (combinable), short flags with values, long options. */
export interface ParsedArgs {
  flags: Set<string>;
  values: Record<string, string>;
  multi: Record<string, string[]>;
  rest: string[];
  unknown: string | null;
}

export interface ArgSpec {
  /** Boolean short flags, e.g. 'lah'. */
  flags?: string;
  /** Short flags taking a value, e.g. 'n'. */
  values?: string;
  /** Long option map. 'name' is boolean; 'name=' takes a value. Maps to a short key. */
  long?: Record<string, string>;
}

export function parseArgs(argv: string[], spec: ArgSpec): ParsedArgs {
  const flags = new Set<string>();
  const values: Record<string, string> = {};
  const multi: Record<string, string[]> = {};
  const rest: string[] = [];
  let unknown: string | null = null;
  const boolShort = spec.flags ?? '';
  const valShort = spec.values ?? '';
  const setValue = (k: string, v: string) => {
    values[k] = v;
    (multi[k] ??= []).push(v);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      rest.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--') && a.length > 2) {
      const eq = a.indexOf('=');
      const name = eq > 0 ? a.slice(2, eq) : a.slice(2);
      const valueKey = spec.long?.[`${name}=`];
      const boolKey = spec.long?.[name];
      if (valueKey !== undefined) {
        setValue(valueKey, eq > 0 ? a.slice(eq + 1) : argv[++i] ?? '');
      } else if (boolKey !== undefined) {
        flags.add(boolKey);
      } else {
        unknown ??= a;
      }
      continue;
    }
    if (a.startsWith('-') && a.length > 1) {
      for (let j = 1; j < a.length; j++) {
        const c = a[j];
        if (boolShort.includes(c)) flags.add(c);
        else if (valShort.includes(c)) {
          const inline = a.slice(j + 1);
          setValue(c, inline.length ? inline : argv[++i] ?? '');
          break;
        } else {
          unknown ??= `-${c}`;
        }
      }
      continue;
    }
    rest.push(a);
  }
  return { flags, values, multi, rest, unknown };
}

/** Bytes for binary-ish strings: chars below 256 are one byte, others UTF-8. */
export function toBytes(s: string): Uint8Array {
  let simple = true;
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      simple = false;
      break;
    }
  }
  if (simple) {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  const parts: number[] = [];
  const enc = new TextEncoder();
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code < 256) parts.push(code);
    else parts.push(...enc.encode(ch));
  }
  return Uint8Array.from(parts);
}

export function pad(s: string | number, n: number): string {
  return String(s).padStart(n);
}
export function padEnd(s: string | number, n: number): string {
  return String(s).padEnd(n);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function lsTime(ms: number, now: number): string {
  const d = new Date(ms);
  const mon = MONTHS[d.getUTCMonth()];
  const day = pad(d.getUTCDate(), 2);
  const sixMonths = 182 * 24 * 3600 * 1000;
  if (Math.abs(now - ms) > sixMonths) return `${mon} ${day}  ${d.getUTCFullYear()}`;
  return `${mon} ${day} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoTime(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' +0000');
}

export function humanSize(n: number): string {
  if (n < 1024) return String(n);
  const units = ['K', 'M', 'G'];
  let v = n;
  let u = -1;
  while (v >= 1024 && u < 2) {
    v /= 1024;
    u++;
  }
  return (v < 10 ? v.toFixed(1) : Math.round(v).toString()) + units[u];
}

export function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export const ANSI = {
  reset: '\x1b[0m',
  dir: '\x1b[34m',
  exec: '\x1b[32m',
  link: '\x1b[36m',
  match: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
};

/** Reads each named input (or stdin for none/-). Reports errors and sets failed. */
export function eachInput(
  ctx: import('../terminal/types').CmdCtx,
  files: string[],
  fn: (text: string, name: string) => void,
): number {
  let code = 0;
  if (files.length === 0) {
    fn(ctx.stdin ?? '', '(standard input)');
    return 0;
  }
  for (const f of files) {
    if (f === '-') {
      fn(ctx.stdin ?? '', '(standard input)');
      continue;
    }
    try {
      fn(ctx.fs.read(ctx.sh.resolvePath(f), ctx.id), f);
    } catch (e) {
      ctx.fail(`${f}: ${(e as Error).message}`);
      code = 1;
    }
  }
  return code;
}
