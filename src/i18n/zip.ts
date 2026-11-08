/**
 * Pairs a source data structure with a translated one of the same shape and returns
 * [source, translation] entries for the catalog. Translation files therefore mirror the
 * content files and stay readable, without repeating any English.
 *
 * - Strings pair up directly.
 * - Arrays pair by index. A row of objects with an `id` can also be written as a record keyed by id.
 * - A row can be written as a single string when it has one thing to translate: a tuple's last
 *   cell (['-l', 'long format']) or the `text` of a message.
 * - `effects` is written as the list of its journal lines, in order. Other effects have no text.
 * - Fields left out of the translation are not translated (ids, paths, accepted answers...).
 */
export type Entry = [string, string];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function zip(en: unknown, fr: unknown, out: Entry[] = []): Entry[] {
  if (fr === undefined || fr === null) return out;
  if (typeof en === 'string' && typeof fr === 'string') {
    out.push([en, fr]);
    return out;
  }
  if (Array.isArray(en)) {
    if (Array.isArray(fr)) {
      en.forEach((row, i) => {
        if (typeof fr[i] !== 'string') zip(row, fr[i], out);
        else if (Array.isArray(row)) zip(row[row.length - 1], fr[i], out);
        else if (isObj(row)) zip(row.text, fr[i], out);
        else zip(row, fr[i], out);
      });
    } else if (isObj(fr)) {
      for (const row of en) {
        if (!isObj(row) || typeof row.id !== 'string') continue;
        const cell = fr[row.id];
        if (typeof cell === 'string') zip(row.text, cell, out);
        else zip(row, cell, out);
      }
    }
    return out;
  }
  if (isObj(en) && isObj(fr)) {
    for (const k of Object.keys(fr)) {
      if (k === 'effects' && Array.isArray(en[k]) && Array.isArray(fr[k])) {
        const lines = (en[k] as unknown[]).filter((e): e is { journal: string } => isObj(e) && typeof e.journal === 'string');
        lines.forEach((e, i) => zip(e.journal, (fr[k] as unknown[])[i], out));
      } else zip(en[k], fr[k], out);
    }
  }
  return out;
}
