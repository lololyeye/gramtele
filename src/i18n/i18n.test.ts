import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import '../data/dialogue';
import { MISSIONS } from '../data/missions';
import { ACHIEVEMENTS, ENDINGS, EVIDENCE, SKILL_NODES } from '../data/progression';
import { seedWorkbench } from '../data/world/hosts';
import { buildSites } from '../data/world/sites';
import { ALL_COMMANDS, HELP_GROUPS } from '../game/commands';
import { VFS } from '../game/filesystem/vfs';
import type { GameState } from '../game/types';
import { documentStrings, localizeDocument } from './documents';
import './fr';
import { chooseLanguage, detectLanguage, getLanguage, hasTranslation, initLanguage, languagePref, setLanguage, tr, trn } from './index';

afterEach(() => setLanguage('en'));

/** Strings with nothing to translate: names, addresses and punctuation stay as they are everywhere. */
const NEUTRAL = /^[^A-Za-z]*$|^[\w.@/-]+\.(test|jpg|pdf)$|^\/[\w./]*$/;
const NAMES = new Set(['Gramtele', 'gramtele', 'S. Reik', 'Lindgate Advisory', 'Blackwell Holdings', 'BLACKWELL', 'Blackwell', 'Blackwell Diligence', 'Gramtele Foundation', 'Hollin Trust', 'Nexus Labs', 'Orion Security', 'TrailTalk', 'GamersDen', 'Folio', 'quietfern', 'hobnail_jo', 'Elin Maret', 'Sanna Reik', 'Sanna Reik | Folio', 'Elin Maret | Folio', 'Maud Ferreira', 'Ruth Aldana', 'Quiet Registrar Ltd', 'Hollander', 'Halden Freight (2024)', 'Brask Utilities (2025)', 'Lindgate Advisory | Public Registry']);

function collectStrings(v: unknown, keys: string[], out: string[]): void {
  if (typeof v !== 'object' || v === null) return;
  for (const [k, c] of Object.entries(v)) {
    if (typeof c === 'string' && keys.includes(k) && c) out.push(c);
    else if (k === 'journal') continue;
    else collectStrings(c, keys, out);
  }
}

const missing = (strings: string[]) => [...new Set(strings)].filter((s) => !hasTranslation(s, 'fr') && !NEUTRAL.test(s) && !NAMES.has(s));

describe('language detection', () => {
  it('maps browser languages', () => {
    expect(detectLanguage(['fr'])).toBe('fr');
    expect(detectLanguage(['fr-CA'])).toBe('fr');
    expect(detectLanguage(['en-GB'])).toBe('en');
    expect(detectLanguage(['de-DE'])).toBe('en');
    expect(detectLanguage(['de-DE', 'fr-FR'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('follows the browser until a choice is made, keeps it, then can go back to automatic', () => {
    const data = new Map<string, string>();
    const kv = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
    initLanguage(kv, ['fr-FR']);
    expect(getLanguage()).toBe('fr');
    expect(languagePref(kv)).toBe('auto');

    chooseLanguage(kv, 'en', ['fr-FR']);
    expect(getLanguage()).toBe('en');
    initLanguage(kv, ['fr-FR']);
    expect(getLanguage()).toBe('en');
    expect(languagePref(kv)).toBe('en');

    chooseLanguage(kv, 'auto', ['fr-FR']);
    expect(getLanguage()).toBe('fr');
    expect(languagePref(kv)).toBe('auto');
  });
});

describe('translation', () => {
  it('passes the player\'s own words through and fills in variables', () => {
    setLanguage('fr');
    expect(tr('something the player typed')).toBe('something the player typed');
    expect(tr('Level {n}', { n: 3 })).toBe('Niveau 3');
    expect(trn('{n} result', '{n} results', 1)).toBe('1 résultat');
    expect(trn('{n} result', '{n} results', 4)).toBe('4 résultats');
  });
});

describe('the French catalog is complete', () => {
  it('missions', () => {
    const out: string[] = [];
    for (const m of MISSIONS) {
      collectStrings(m, ['chapterTitle', 'title', 'intro', 'term', 'text', 'note', 'prompt', 'placeholder', 'wrong', 'right', 'why', 'decision', 'accomplished', 'professional', 'environment'], out);
      out.push(...m.requires, ...m.intro, ...m.resources, ...m.review.concepts, ...m.review.defend);
      for (const o of m.objectives) out.push(...o.hints);
      for (const f of m.files ?? []) if (f.file.data) out.push(f.file.data);
    }
    expect(missing(out.filter((s) => !/^(x\.x\.x\.x|c-0000|d-0000)$/.test(s)))).toEqual([]);
  });

  it('progression and endings', () => {
    const out: string[] = [];
    for (const n of SKILL_NODES) out.push(n.title, n.text);
    for (const a of ACHIEVEMENTS) out.push(a.title, a.text);
    for (const e of Object.values(EVIDENCE)) out.push(e.title, e.summary);
    const names = ['gave_location', 'gave_echo_to_moth', 'vanta_helps', 'read_notes41', 'sealed_kept'];
    for (const standing of [0, 900])
    for (const e of Object.values(ENDINGS)) {
      out.push(e.title, e.epigraph);
      for (let bits = 0; bits < 32; bits++) {
        const flags = Object.fromEntries(names.map((n, i) => [n, Boolean(bits & (1 << i))]));
        out.push(...e.paragraphs({ flags, standing } as unknown as GameState));
      }
    }
    expect(missing(out)).toEqual([]);
  });

  it('manual pages', () => {
    const out: string[] = HELP_GROUPS.map(([t]) => t);
    for (const c of ALL_COMMANDS) {
      if (!c.man) continue;
      out.push(c.man.name, c.man.description);
      if (c.man.why) out.push(c.man.why);
      for (const o of c.man.options ?? []) out.push(o[1]);
      for (const e of c.man.examples ?? []) out.push(e[1]);
    }
    expect(missing(out)).toEqual([]);
  });

  it('every literal in tr() and trn()', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) { if (!p.includes('i18n')) walk(p); }
        else if (/\.tsx?$/.test(n) && !n.includes('.test.')) files.push(p);
      }
    };
    walk('src');
    const lit = String.raw`'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"`;
    const found: string[] = [];
    const unquote = (s: string) => s.slice(1, -1).replace(/\\(.)/g, '$1');
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(new RegExp(String.raw`(?<![\w.])tr\(\s*(${lit})`, 'g'))) found.push(unquote(m[1]));
      for (const m of src.matchAll(new RegExp(String.raw`(?<![\w.])trn\(\s*(${lit})\s*,\s*(${lit})`, 'g'))) found.push(unquote(m[1]), unquote(m[2]));
    }
    expect(found.length).toBeGreaterThan(300);
    expect(missing(found)).toEqual([]);
  });

  it('web pages and documents', () => {
    const out: string[] = [];
    for (const site of buildSites()) {
      const pages = (site as unknown as { pages?: Record<string, { body: string; type?: string }> }).pages;
      if (!pages) continue;
      for (const [path, page] of Object.entries(pages)) {
        if (page.type === 'image/jpeg' || path === '/robots.txt') continue;
        out.push(...documentStrings(page.body));
      }
    }
    expect(missing(out)).toEqual([]);
  });

  it('story files on the workbench', () => {
    const fs = new VFS({ now: () => 0 } as never);
    seedWorkbench(fs);
    for (const path of ['/home/player/notes.txt', '/home/player/.cache/.notes_41', '/home/player/Documents/assignments/2026/intake/intake.txt', '/home/player/Documents/assignments/2026/intake/old_draft.txt', '/home/player/Documents/readme.txt', '/opt/relay/README', '/etc/motd', '/etc/sudoers.d/90-workbench']) {
      const node = fs.stat(path);
      const raw = fs.rawContent(node as never);
      expect(hasTranslation(raw, 'fr'), path).toBe(true);
    }
  });

  it('keeps links and paths in localized pages', () => {
    setLanguage('fr');
    const nexus = buildSites().find((s) => s.host === 'nexus-labs.test') as unknown as { pages: Record<string, { body: string }> };
    const html = localizeDocument(nexus.pages['/news'].body);
    expect(html).toContain('href="/news/nx417-topline.pdf"');
    expect(html).toContain('Actualités');
    expect(html).toContain('lang="fr"');
    const pdf = localizeDocument(nexus.pages['/news/bulletin-2021-q3.pdf'].body);
    expect(pdf).toContain('quietfern');
    expect(pdf).toContain('Author');
  });
});
