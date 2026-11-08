/**
 * Translation layer. English is the source language and the code holds English strings;
 * every other language is a catalog that maps a source string to its translation.
 * Saves keep the source text, so switching language re-renders old messages too.
 *
 * No React here: the engine and the terminal commands use it as well.
 */
export type Language = 'en' | 'fr';
export type LanguagePref = Language | 'auto';

export const LANGUAGES: { id: Language; label: string; locale: string }[] = [
  { id: 'en', label: 'English', locale: 'en-GB' },
  { id: 'fr', label: 'Français', locale: 'fr-FR' },
];

type Catalog = Map<string, string>;
const catalogs: Partial<Record<Language, Catalog>> = {};
let current: Language = 'en';

export function registerCatalog(lang: Language, entries: Iterable<[string, string]>): void {
  const c = (catalogs[lang] ??= new Map());
  for (const [k, v] of entries) c.set(k, v);
}

export function setLanguage(lang: Language): void {
  current = lang;
}

export function getLanguage(): Language {
  return current;
}

export function localeTag(): string {
  return LANGUAGES.find((l) => l.id === current)?.locale ?? 'en-GB';
}

export function hasTranslation(text: string, lang: Language): boolean {
  return catalogs[lang]?.has(text) ?? false;
}

/** Translates a source string. Unknown strings, like what the player typed, pass through. */
export function tr(text: string, vars?: Record<string, string | number>): string {
  let out = current === 'en' ? text : (catalogs[current]?.get(text) ?? text);
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  return out;
}

/** Chooses between "one" and "many" forms, then translates. French treats 0 as singular. */
export function trn(one: string, many: string, n: number, vars?: Record<string, string | number>): string {
  const singular = current === 'fr' ? n <= 1 : n === 1;
  return tr(singular ? one : many, { n, ...vars });
}

// ---------- language selection ----------

/** Picks a language from the browser's preferred list. Only the first preference counts. */
export function detectLanguage(preferred: readonly string[] | undefined): Language {
  const first = (preferred?.[0] ?? '').toLowerCase();
  return first === 'fr' || first.startsWith('fr-') ? 'fr' : 'en';
}

interface StoredLang {
  pref: LanguagePref;
  detected: Language;
}

const LANG_KEY = 'gramtele.lang';

export interface LangStorage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

function readStored(kv: LangStorage): StoredLang | null {
  try {
    const raw = kv.getItem(LANG_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<StoredLang>;
    const validPref = p.pref === 'auto' || p.pref === 'en' || p.pref === 'fr';
    const validDet = p.detected === 'en' || p.detected === 'fr';
    return validPref && validDet ? (p as StoredLang) : null;
  } catch {
    return null;
  }
}

function writeStored(kv: LangStorage, v: StoredLang): void {
  try {
    kv.setItem(LANG_KEY, JSON.stringify(v));
  } catch {
    // Private windows can refuse storage. The language still applies for this visit.
  }
}

/** First visit: detect and remember. Later visits: the stored choice wins over the browser. */
export function initLanguage(kv: LangStorage, preferred: readonly string[] | undefined): StoredLang {
  const stored = readStored(kv) ?? { pref: 'auto' as const, detected: detectLanguage(preferred) };
  writeStored(kv, stored);
  setLanguage(stored.pref === 'auto' ? stored.detected : stored.pref);
  return stored;
}

/** Applies a choice from Settings. "auto" detects again from the browser. */
export function chooseLanguage(kv: LangStorage, pref: LanguagePref, preferred: readonly string[] | undefined): StoredLang {
  const next: StoredLang = { pref, detected: pref === 'auto' ? detectLanguage(preferred) : (readStored(kv)?.detected ?? detectLanguage(preferred)) };
  writeStored(kv, next);
  setLanguage(pref === 'auto' ? next.detected : pref);
  return next;
}

export function languagePref(kv: LangStorage): LanguagePref {
  return readStored(kv)?.pref ?? 'auto';
}
