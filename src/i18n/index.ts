import { EN_MAN, ManText } from './en/man';
import { EN_UI, UiKey } from './en/ui';

/**
 * Language layer. Everything the game writes lives in one dataset per language, reached by key.
 * Saves keep keys, so switching language re-renders old messages too.
 * See docs/LOCALIZATION.md.
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

// ---------- written lines ----------

/**
 * A line is never derived from another language, and a missing one is never replaced by another language:
 * it fails loudly while developing and shows a visible marker in production.
 */
export const LINE = '§';
const lineSets: Partial<Record<Language, Catalog>> = {};
let lineVars: Record<string, string> = {};
const reported = new Set<string>();

/** Adds to what the language already has: dialogue, missions and the interface each bring their own set. */
export function registerLines(lang: Language, lines: Map<string, string>): void {
  const set = (lineSets[lang] ??= new Map());
  for (const [k, v] of lines) set.set(k, v);
}

/** Turns a language's interface table into lines. */
export const uiLines = (table: Record<UiKey, string>): Map<string, string> =>
  new Map(Object.entries(table).map(([k, v]) => [`ui.${k}`, v]));

/** Turns a language's manual into lines. Flags and example commands are part of the key. */
export function manLines(table: Record<string, ManText>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, page] of Object.entries(table)) {
    out.set(`man.${name}.name`, page.name);
    out.set(`man.${name}.description`, page.description);
    if (page.why) out.set(`man.${name}.why`, page.why);
    for (const field of ['options', 'examples'] as const) {
      for (const [k, v] of Object.entries(page[field] ?? {})) out.set(`man.${name}.${field}.${k}`, v);
    }
  }
  return out;
}

registerLines('en', uiLines(EN_UI));
registerLines('en', manLines(EN_MAN));

/** An interface text as a stored key, for constants and saves that are read through tr() later. */
export const ui = (key: UiKey): string => lineKey(`ui.${key}`);

/** Values for the {placeholders} characters use, such as the player's handle. */
export function setLineVars(vars: Record<string, string>): void {
  lineVars = vars;
}

export const isLine = (text: string): boolean => text.startsWith(LINE);
export const lineKey = (key: string): string => `${LINE}${key}`;

/** The raw line in a given language, or null when that language does not have it. */
export function lineIn(lang: Language, text: string): string | null {
  return lineSets[lang]?.get(text.slice(LINE.length)) ?? null;
}

/** Saves from before the datasets hold the English sentence itself. This finds its key, so they can be upgraded once. */
export function keyOfEnglish(text: string): string | null {
  for (const [k, v] of lineSets.en ?? []) if (v === text) return lineKey(k);
  return null;
}

/** The same for the workbench's files only, so that a file the player wrote is left alone. */
export function worldFileKey(text: string): string | null {
  for (const [k, v] of lineSets.en ?? []) if (k.startsWith('files.') && v === text) return lineKey(k);
  return null;
}

export function lineKeys(lang: Language): string[] {
  return [...(lineSets[lang]?.keys() ?? [])];
}

function fillLine(text: string): string {
  const found = lineIn(current, text);
  if (found !== null) return found;
  // In no language at all: not one of our keys, so it is the player's own text that happens to start with the mark.
  if (LANGUAGES.every((l) => lineIn(l.id, text) === null)) return text;
  const message = `Missing ${current} line: ${text.slice(LINE.length)}`;
  if (import.meta.env?.DEV || import.meta.env?.MODE === 'test') throw new Error(message);
  if (!reported.has(text)) {
    reported.add(text);
    console.error(message);
  }
  return `[${current}: ${text.slice(LINE.length)}]`;
}

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
  return isLine(text) ? lineIn(lang, text) !== null : (catalogs[lang]?.has(text) ?? false);
}

/** Reads a stored key in the current language. Unknown text, like what the player typed, passes through. The only catalog left is for messages stored in very old saves. */
export function tr(text: string, vars?: Record<string, string | number>): string {
  const line = isLine(text);
  let out = line ? fillLine(text) : current === 'en' ? text : (catalogs[current]?.get(text) ?? text);
  const all = line ? { ...lineVars, ...vars } : vars;
  if (all) out = out.replace(/\{(\w+)\}/g, (m, k: string) => (k in all ? String(all[k]) : m));
  return out;
}

/** An interface text in the current language. The key is checked at compile time. */
export function T(key: UiKey, vars?: Record<string, string | number>): string {
  return tr(ui(key), vars);
}

/** Chooses between the "one" and "many" keys. French treats 0 as singular. */
export function Tn(one: UiKey, many: UiKey, n: number, vars?: Record<string, string | number>): string {
  const singular = current === 'fr' ? n <= 1 : n === 1;
  return T(singular ? one : many, { n, ...vars });
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
