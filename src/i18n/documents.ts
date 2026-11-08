import { getLanguage, tr } from './index';

/**
 * Localizes a whole simulated document as it leaves a site: the text between HTML tags, or the text
 * lines and title of a PDF. Markup, addresses and links are left alone, so the same pages exist in
 * every language and links, paths and evidence tags keep working.
 */
export function localizeDocument(body: string): string {
  if (getLanguage() === 'en' || !body) return body;
  if (body.startsWith('%PDF')) {
    return body
      .replace(/\((.*)\) Tj/g, (_, line: string) => `(${line ? tr(line) : line}) Tj`)
      .replace(/\/Title \((.*)\)/, (_, title: string) => `/Title (${tr(title)})`);
  }
  if (!/^<!doctype html/i.test(body)) return tr(body);
  const styled: string[] = [];
  const shielded = body
    .replace(/<style[\s\S]*?<\/style>/gi, (m) => `<style data-s="${styled.push(m) - 1}"></style>`)
    .replace(/<pre[\s\S]*?<\/pre>/gi, (m) => m.replace(/>([^<]*)</g, (_, t: string) => `>\u0001${t}<`));
  const out = shielded
    .replace(/>([^<]+)</g, (whole, text: string) => {
      if (text.startsWith('\u0001')) return `>${text.slice(1)}<`;
      const trimmed = text.trim();
      if (!trimmed) return whole;
      return `>${text.replace(trimmed, tr(trimmed))}<`;
    })
    .replace(/<style data-s="(\d+)"><\/style>/g, (_, i: string) => styled[Number(i)])
    .replace('<html lang="en">', `<html lang="${getLanguage()}">`);
  return out;
}

/** Every piece of text in a document, in the form the catalogs use. Used by the completeness test. */
export function documentStrings(body: string): string[] {
  if (body.startsWith('%PDF')) {
    return [...[...body.matchAll(/\((.*)\) Tj/g)].map((m) => m[1]), /\/Title \((.*)\)/.exec(body)?.[1] ?? ''].filter(Boolean);
  }
  const bare = body.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<pre[\s\S]*?<\/pre>/gi, '');
  return [...bare.matchAll(/>([^<]+)</g)].map((m) => m[1].trim()).filter(Boolean);
}
