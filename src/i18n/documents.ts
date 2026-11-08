import { getLanguage, Language, lineIn, tr } from './index';

/**
 * Simulated documents are stored once, as layout with keys where the words go (`§pages.nexus.home.body`).
 * This writes the words in as a document leaves a site. Layout, addresses and links stay the same in every language.
 */
const KEY = /§[\w.-]+/g;

export function localizeDocument(body: string, lang: Language = getLanguage()): string {
  const filled = body.replace(KEY, (key) => (lang === getLanguage() ? tr(key) : (lineIn(lang, key) ?? '')));
  return filled.replace('<html lang="en">', `<html lang="${lang}">`);
}

/** Every key a document asks for. Used by the completeness checks. */
export const documentKeys = (body: string): string[] => (body.match(KEY) ?? []).map((k) => k.slice(1));
