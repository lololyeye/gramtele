/**
 * Synthetic document formats. Files are byte-accurate at the signature level and
 * carry readable metadata blocks, so file, xxd, strings and exiftool all give
 * consistent answers from the same bytes.
 */

export interface DocMeta {
  [key: string]: string;
}

const JPEG_MAGIC = '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01';

export function makeJpeg(meta: DocMeta, width = 4032, height = 3024): string {
  const exif = Object.entries(meta)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  return `${JPEG_MAGIC}\xff\xe1Exif\x00\x00\n${exif}\n\xff\xdb\xff\xc0SOF ${width}x${height}\n\xff\xda(compressed image data omitted)\xff\xd9`;
}

export function makePdf(meta: DocMeta, pages: string[]): string {
  const info = Object.entries(meta)
    .map(([k, v]) => `/${k} (${v})`)
    .join('\n');
  const body = pages
    .map((p, i) => `${i + 3} 0 obj\n<< /Type /Page >>\nstream\nBT\n${p.split('\n').map((l) => `(${l}) Tj`).join('\n')}\nET\nendstream\nendobj`)
    .join('\n');
  return `%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n2 0 obj\n<<\n${info}\n>>\nendobj\n${body}\ntrailer\n<< /Info 2 0 R >>\n%%EOF\n`;
}

export function makeZipStub(entries: string[]): string {
  return `PK\x03\x04\x14\x00\x00\x00\x08\x00${entries.join('\x00')}\x00PK\x05\x06`;
}

export function pdfText(raw: string): string {
  const lines: string[] = [];
  for (const m of raw.matchAll(/\((.*)\) Tj/g)) lines.push(m[1]);
  return lines.join('\n') + '\n';
}

export function readExif(raw: string): DocMeta | null {
  if (raw.startsWith('%PDF')) {
    const m = /2 0 obj\n<<\n([\s\S]*?)\n>>/.exec(raw);
    const out: DocMeta = {};
    if (m) for (const l of m[1].split('\n')) {
      const kv = /^\/(\w+) \((.*)\)$/.exec(l);
      if (kv) out[kv[1]] = kv[2];
    }
    return out;
  }
  if (raw.startsWith('\xff\xd8\xff')) {
    const m = /Exif\x00\x00\n([\s\S]*?)\n\xff\xdb/.exec(raw);
    const out: DocMeta = {};
    if (m) for (const l of m[1].split('\n')) {
      const i = l.indexOf('=');
      if (i > 0) out[l.slice(0, i)] = l.slice(i + 1);
    }
    return out;
  }
  return null;
}

export function sniffType(raw: string): string {
  if (raw.length === 0) return 'empty';
  if (raw.startsWith('%PDF-')) return `PDF document, version ${raw.slice(5, 8)}`;
  if (raw.startsWith('\xff\xd8\xff')) {
    const sof = /SOF (\d+x\d+)/.exec(raw);
    return `JPEG image data, JFIF standard 1.01, Exif metadata${sof ? `, ${sof[1].replace('x', ' x ')}` : ''}`;
  }
  if (raw.startsWith('PK\x03\x04')) return 'Zip archive data, at least v2.0 to extract';
  if (raw.startsWith('SQLite format 3')) return 'SQLite 3.x database';
  if (raw.startsWith('\x7fELF')) return 'ELF 64-bit LSB executable, x86-64, dynamically linked';
  if (raw.startsWith('#!')) {
    const first = raw.split('\n', 1)[0];
    return `${first.includes('python') ? 'Python' : 'Bourne-Again shell'} script, ASCII text executable`;
  }
  if (/^-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(raw)) return 'PEM private key';
  if (/^-----BEGIN PGP/.test(raw)) return 'PGP message';
  if (/^\s*<(!doctype html|html)/i.test(raw)) return 'HTML document, ASCII text';
  if (/^\s*[{[]/.test(raw) && raw.trimEnd().match(/[}\]]$/)) return 'JSON text data';
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0e-\x1f\x80-\xff]/.test(raw)) return 'data';
  return 'ASCII text';
}
