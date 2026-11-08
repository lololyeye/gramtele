import type { Command } from '../terminal/types';
import { eachInput, parseArgs, splitLines, toBytes } from './args';
import { pdfText, readExif, sniffType } from './magic';

// ---------- SHA-256 (implemented locally so hashing is synchronous and works anywhere) ----------

const K = (() => {
  const primes: number[] = [];
  for (let n = 2; primes.length < 64; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) isPrime = false;
    if (isPrime) primes.push(n);
  }
  return primes.map((p) => Math.floor((Math.cbrt(p) % 1) * 2 ** 32) >>> 0);
})();

export function sha256(input: string): string {
  const msg = toBytes(input);
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bitLen = msg.length * 8;
  const padded = new Uint8Array(((msg.length + 9 + 63) >> 6) << 6);
  padded.set(msg);
  padded[msg.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen >>> 0);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32));
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(off + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}

// ---------- base64 over UTF-8 ----------

export function b64encode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function b64decode(s: string): string | null {
  try {
    const bin = atob(s.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

const sha256sum: Command = {
  name: 'sha256sum',
  tool: 'forensics',
  man: {
    name: 'compute or check SHA-256 hashes',
    synopsis: ['sha256sum FILE...', 'sha256sum -c MANIFEST'],
    description: 'Computes a 256-bit fingerprint of a file. Change a single byte and the hash changes completely. With -c, reads "HASH  FILE" lines and verifies each one. Your copy, or evidence you were handed, either matches the record or it does not.',
    options: [['-c FILE', 'check hashes listed in FILE']],
    examples: [['sha256sum auth.log', 'fingerprint a file'], ['sha256sum -c MANIFEST.sha256', 'verify a whole evidence bundle']],
    why: 'Hashes are how forensic evidence stays defensible. You record the hash at collection, and anyone can later verify nothing changed. MD5 and SHA-1 have known collisions; use SHA-256.',
  },
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'cb', long: { check: 'c' } });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    if (a.flags.has('c')) {
      let bad = 0;
      let code = 0;
      const out = eachInput(ctx, a.rest, (text) => {
        for (const line of splitLines(text)) {
          const m = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim());
          if (!m) continue;
          try {
            const actual = sha256(ctx.fs.read(ctx.sh.resolvePath(m[2]), ctx.id));
            if (actual === m[1]) ctx.line(`${m[2]}: OK`);
            else {
              ctx.line(`${m[2]}: FAILED`);
              bad++;
            }
          } catch (e) {
            ctx.err(`sha256sum: ${m[2]}: ${(e as Error).message}\n`);
            ctx.line(`${m[2]}: FAILED open or read`);
            bad++;
          }
        }
      });
      if (bad) {
        ctx.err(`sha256sum: WARNING: ${bad} computed checksum${bad > 1 ? 's' : ''} did NOT match\n`);
        code = 1;
      }
      return out || code;
    }
    return eachInput(ctx, a.rest, (text, name) => {
      ctx.line(`${sha256(text)}  ${a.rest.length ? name : '-'}`);
    });
  },
};

const base64: Command = {
  name: 'base64',
  tool: 'forensics',
  man: {
    name: 'encode or decode base64',
    synopsis: ['base64 [FILE]', 'base64 -d [FILE]'],
    description: 'Base64 represents arbitrary bytes using only 64 printable characters, so binary data can travel through text channels. Output often ends with = padding. It is an encoding: anyone can reverse it. No key, no secrecy.',
    options: [['-d', 'decode']],
    examples: [['echo -n admin | base64', 'gives YWRtaW4='], ['echo YWRtaW4= | base64 -d', 'gives admin']],
    why: 'Base64 is everywhere: HTTP basic auth, session tokens, email attachments. Mistaking it for encryption is a classic, very real security bug.',
  },
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'dw', long: { decode: 'd' } });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    return eachInput(ctx, a.rest, (text) => {
      if (a.flags.has('d')) {
        const out = b64decode(text);
        if (out === null) ctx.err('base64: invalid input\n');
        else ctx.out(out);
      } else {
        const enc = b64encode(text);
        for (let i = 0; i < enc.length; i += 76) ctx.line(enc.slice(i, i + 76));
      }
    });
  },
};

const xxd: Command = {
  name: 'xxd',
  tool: 'forensics',
  man: {
    name: 'make a hexdump, or reverse one',
    synopsis: ['xxd [-l N] FILE', 'xxd -p FILE', 'xxd -r -p'],
    description: 'Shows the raw bytes of a file in hexadecimal, with printable characters on the right. -r -p turns plain hex back into bytes, useful when someone hands you a hex string.',
    options: [['-l N', 'stop after N bytes'], ['-p', 'plain hex with no addresses'], ['-r', 'reverse: hex to bytes']],
    examples: [['xxd -l 16 photo.jpg', 'the first bytes reveal the true file type: ff d8 ff is JPEG'], ['echo 68656c6c6f | xxd -r -p', 'decodes to "hello"']],
    why: 'File signatures, hidden data, malformed headers: when tools disagree, the bytes settle it.',
  },
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'pr', values: 'l' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    return eachInput(ctx, a.rest, (text) => {
      if (a.flags.has('r')) {
        const hex = text.replace(/[^0-9a-fA-F]/g, '');
        const bytes = new Uint8Array(hex.length >> 1);
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        ctx.out(new TextDecoder().decode(bytes));
        return;
      }
      let bytes = toBytes(text);
      if (a.values.l) bytes = bytes.slice(0, Number(a.values.l));
      if (a.flags.has('p')) {
        const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
        for (let i = 0; i < hex.length; i += 60) ctx.line(hex.slice(i, i + 60));
        return;
      }
      for (let off = 0; off < bytes.length; off += 16) {
        const row = bytes.slice(off, off + 16);
        let hex = '';
        row.forEach((b, i) => {
          hex += b.toString(16).padStart(2, '0') + (i % 2 ? ' ' : '');
        });
        const ascii = [...row].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
        ctx.line(`${off.toString(16).padStart(8, '0')}: ${hex.padEnd(40)} ${ascii}`);
      }
    });
  },
};

const strings: Command = {
  name: 'strings',
  tool: 'forensics',
  man: {
    name: 'print printable character sequences in a file',
    synopsis: ['strings [-n MIN] FILE'],
    description: 'Scans any file, binary included, for runs of printable characters of at least 4 characters. A blunt but astonishingly effective first look at an unknown file.',
    options: [['-n N', 'minimum run length']],
    examples: [['strings photo.jpg | head', 'what readable text is embedded in here?']],
    why: 'Paths, URLs, author names and leftover comments survive inside binaries more often than their authors expect.',
  },
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { values: 'n' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const min = Number(a.values.n ?? 4);
    return eachInput(ctx, a.rest, (text) => {
      const bytes = toBytes(text);
      let cur = '';
      for (const b of bytes) {
        if (b >= 32 && b < 127) cur += String.fromCharCode(b);
        else {
          if (cur.length >= min) ctx.line(cur);
          cur = '';
        }
      }
      if (cur.length >= min) ctx.line(cur);
    });
  },
};

const exiftool: Command = {
  name: 'exiftool',
  tool: 'osint',
  man: {
    name: 'read file metadata',
    synopsis: ['exiftool FILE...'],
    description: 'Reads metadata embedded in documents and images: author, software, creation dates, camera model, GPS coordinates. Many people have no idea this data travels with their files.',
    examples: [['exiftool ridge_0412.jpg', 'where and when was this photo taken?'], ['exiftool newsletter.pdf', 'who wrote this document, on what software?']],
    why: 'Metadata has ended careers and located fugitives. The defensive lesson: strip it before you publish anything. It can also be forged, so corroborate.',
  },
  run(ctx) {
    if (ctx.argv.length < 2) return ctx.fail('usage: exiftool FILE...');
    let code = 0;
    for (const f of ctx.argv.slice(1)) {
      try {
        const p = ctx.sh.resolvePath(f);
        const raw = ctx.fs.read(p, ctx.id);
        const node = ctx.fs.stat(p, ctx.id);
        const row = (k: string, v: string) => ctx.line(`${k.padEnd(32)}: ${v}`);
        if (ctx.argv.length > 2) ctx.line(`======== ${f}`);
        row('File Name', p.split('/').pop()!);
        row('File Size', `${ctx.fs.size(node)} bytes`);
        row('File Type', sniffType(raw).split(',')[0]);
        const meta = readExif(raw);
        if (!meta || !Object.keys(meta).length) {
          row('Warning', 'No embedded metadata found');
          continue;
        }
        for (const [k, v] of Object.entries(meta)) row(k.replace(/([a-z])([A-Z])/g, '$1 $2'), v);
      } catch (e) {
        ctx.line(`Error: File not found or unreadable - ${f} (${(e as Error).message})`);
        code = 1;
      }
    }
    return code;
  },
};

const pdftotext: Command = {
  name: 'pdftotext',
  tool: 'osint',
  man: {
    name: 'extract text from a PDF',
    synopsis: ['pdftotext FILE [-]'],
    description: 'Prints the text content of a PDF to standard output, so that it can be piped into grep and friends.',
    examples: [['pdftotext newsletter.pdf | grep -i maret', 'find a name in a document']],
  },
  run(ctx) {
    const f = ctx.argv[1];
    if (!f) return ctx.fail('usage: pdftotext FILE [-]');
    try {
      const raw = ctx.fs.read(ctx.sh.resolvePath(f), ctx.id);
      if (!raw.startsWith('%PDF')) return ctx.fail(`Syntax Error: May not be a PDF file: ${f}`);
      ctx.out(pdfText(raw));
      return 0;
    } catch (e) {
      return ctx.fail(`${f}: ${(e as Error).message}`);
    }
  },
};

export const forensicCommands: Command[] = [sha256sum, base64, xxd, strings, exiftool, pdftotext];
