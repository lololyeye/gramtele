import { afterEach, describe, expect, it } from 'vitest';
import { CHARACTERS } from '../characters';
import { lineIn, lineKey, lineKeys, registerLines, setLanguage, tr } from '../../i18n';
import { EN_UI } from '../../i18n/en/ui';
import '../../i18n/fr';
import { CHAPTERS, MISSIONS } from '../missions';
import { ACHIEVEMENTS, ENDINGS, EVIDENCE, SKILL_NODES, SKILL_TITLES } from '../progression';
import { BEATS } from '.';
import { FILE_COUNTS, GROUP_SPEAKERS, SMALL_COUNTS } from './smalltalk';
import type { Tier } from '../reputation';

/**
 * `npm run i18n:check`. English and French are written separately, so nothing guarantees they tell the
 * same story except this file: same scenes, same clues, and voices that stay what docs/VOICES.md says.
 */

interface Spoken { key: string; speaker: string }

function spokenLines(): Spoken[] {
  const out: Spoken[] = [];
  const add = (key: string, speaker: string) => out.push({ key: key.slice(1), speaker });
  for (const b of BEATS) {
    for (const m of b.messages) add(m.text, m.from ?? b.thread);
    for (const c of b.choices ?? []) for (const m of c.then ?? []) add(m.text, m.from ?? b.thread);
  }
  for (const [thread, tiers] of Object.entries(SMALL_COUNTS)) {
    for (const [tier, count] of Object.entries(tiers ?? {})) {
      for (let i = 0; i < (count ?? 0); i++) add(lineKey(`small.${thread}.${tier}.${i}`), thread === 'lowlight' ? GROUP_SPEAKERS[tier as Tier][i] : thread);
    }
  }
  for (const [thread, count] of Object.entries(FILE_COUNTS)) {
    for (let i = 0; i < (count ?? 0); i++) add(lineKey(`file.${thread}.${i}`), thread === 'lowlight' ? ['tinsel', 'kelpie'][i] : thread);
  }
  return out;
}

const SPOKEN = spokenLines();
const en = (key: string) => lineIn('en', lineKey(key)) ?? '';
const fr = (key: string) => lineIn('fr', lineKey(key)) ?? '';

function neededKeys(): string[] {
  const out = new Set(SPOKEN.map((s) => s.key));
  const add = (k: string | undefined) => k && out.add(k.slice(1));
  for (const b of BEATS) {
    for (const e of b.effects ?? []) if ('journal' in e) add(e.journal);
    for (const c of b.choices ?? []) {
      add(c.label);
      add(c.reply);
      add(c.decision);
      for (const e of c.effects ?? []) if ('journal' in e) add(e.journal);
    }
  }
  for (const c of Object.values(CHARACTERS)) {
    add(c.tagline);
    add(c.joined);
    c.bio.forEach(add);
    for (const r of c.reveals ?? []) {
      add(r.label);
      add(r.value);
    }
  }
  const names = ['gave_location', 'gave_echo_to_moth', 'vanta_helps', 'read_notes41', 'sealed_kept'];
  for (const e of Object.values(ENDINGS)) {
    add(e.title);
    add(e.epigraph);
    for (const standing of [0, 900]) {
      for (let bits = 0; bits < 32; bits++) {
        const flags = Object.fromEntries(names.map((n, i) => [n, Boolean(bits & (1 << i))]));
        e.paragraphs({ flags, standing } as never).forEach(add);
      }
    }
  }
  add('§misc.export_preview');
  for (const k of writtenKeys()) out.add(k);
  return [...out];
}

/** Every key a mission, a record screen or the interface asks for. */
function writtenKeys(): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'string') { if (v.startsWith('§')) out.add(v.slice(1)); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(MISSIONS);
  walk(CHAPTERS);
  walk(SKILL_TITLES);
  walk(SKILL_NODES);
  walk(ACHIEVEMENTS);
  walk(EVIDENCE);
  for (const k of Object.keys(EN_UI)) out.add(`ui.${k}`);
  return [...out];
}

const missionKeys = () => writtenKeys().filter((k) => k.startsWith('missions.'));
/** Not sentences a person reads as language: a number format, a handle-shaped mask. */
const FORMAT = /^(x\.x\.x\.x|c-0000|d-0000)$/;

/** Things a player might act on or compare: they must be identical in both languages. */
function clues(text: string): string[] {
  const found = text.match(/\b[\w-]+\.test\b|\bd-[0-9a-f]{4}\b|\bc-\d{4}\b|\bNX-\d+\b|\d+/g) ?? [];
  return [...new Set(found)].sort();
}

const EMOJI = /\p{Extended_Pictographic}/u;
const by = (who: string) => SPOKEN.filter((s) => s.speaker === who);
const isEncoded = (s: string) => /^[A-Za-z0-9+/=]{16,}$/.test(s) || /^[0-9a-f]{32,}$/.test(s);

afterEach(() => setLanguage('en'));

describe('both languages tell the same story', () => {
  it('has every line the script asks for, in both languages', () => {
    const keys = neededKeys();
    expect(keys.filter((k) => lineIn('en', lineKey(k)) === null), 'missing in English').toEqual([]);
    expect(keys.filter((k) => lineIn('fr', lineKey(k)) === null), 'missing in French').toEqual([]);
  });

  it('has no line the script never uses', () => {
    const keys = new Set(neededKeys());
    expect(lineKeys('en').filter((k) => !keys.has(k)), 'unused in English').toEqual([]);
    expect(lineKeys('fr').filter((k) => !keys.has(k)), 'unused in French').toEqual([]);
  });

  it('keeps the same clues: addresses, devices, contractor numbers and every figure', () => {
    const encoded = (k: string) => isEncoded(en(k)) || /^[a-z ]+$/.test(en(k)) && /fragment/.test(k);
    const different = neededKeys()
      .filter((k) => !encoded(k) && !k.startsWith('e1_fragment') && !k.startsWith('e2_fragment') && !k.startsWith('e3_fragment') && !k.startsWith('char.'))
      .filter((k) => clues(en(k)).join() !== clues(fr(k)).join())
      .map((k) => `${k}: ${clues(en(k))} / ${clues(fr(k))}`);
    expect(different).toEqual([]);
  });

  it('never ships a French line identical to the English one, unless there is nothing to translate', () => {
    const neutral = /^(\W*|NULL|Sessions|Blackwell Holdings, Special Engagements\.|bWFuIGJhc2U2NA==)$/;
    // One word, or a list of commands: "Terminal", "JOIN", "sudo -l" are the same in both.
    const literal = /^[\p{L}\d .,+/()_{}-]*$/u;
    const same = neededKeys().filter((k) => en(k) === fr(k) && !neutral.test(en(k)) && !isEncoded(en(k)) && !k.startsWith('e2_fragment') && !FORMAT.test(en(k)))
      .filter((k) => !((k.startsWith('ui.') || k.includes('.resources.') || k.includes('.hints.') || k.startsWith('skills.') || k.startsWith('nodes.') || k.includes('.title') || k.includes('.term') || k.includes('.review.concepts') || k.includes('.placeholder')) && (literal.test(en(k)) && en(k).split(' ').length <= 6 || k.includes('.hints.'))));
    expect(same).toEqual([]);
  });

  it('refuses to fall back to another language when a line is missing', () => {
    registerLines('en', new Map([['only.in.english', 'English only']]));
    setLanguage('fr');
    expect(() => tr('§only.in.english')).toThrow(/Missing fr line/);
    expect(tr('something the player typed')).toBe('something the player typed');
  });
});

describe('missions say the same thing in both languages', () => {
  /** What a player copies from a hint or compares with a tool: if it differs, they fail for a reason that is not theirs. */
  function literals(text: string): string[] {
    const found = text.match(/~?\/[\w./-]+|(?<![\w-])--?[a-zA-Z][\w-]*|\bsubmit [a-z_]+(?: [\w./-]*[\d.][\w./-]*)?|\b(?:SELECT|FROM|JOIN|WHERE|GROUP BY|ORDER BY|DESC|DISTINCT|COUNT|SUM|DELETE|REFERENCES|FATAL|NOPASSWD)\b|\.(?:schema|tables|headers|mode)\b|\b[a-z_]+\.(?:txt|db|conf|jpg|pdf|html|tar)\b|\b(?:uid|sev|lat|lon)=[\w.]*/g) ?? [];
    return [...new Set(found)].sort();
  }

  it('hints, notes and error messages keep every command, path, flag and query', () => {
    const different = missionKeys()
      .filter((k) => /\.(hints\.\d|note|wrong|text|right)$/.test(k))
      .filter((k) => literals(en(k)).join('|') !== literals(fr(k)).join('|'))
      .map((k) => `${k}\n  en: ${literals(en(k))}\n  fr: ${literals(fr(k))}`);
    expect(different).toEqual([]);
  });

  it('assignment files keep their paths and commands, line by line', () => {
    const different = missionKeys().filter((k) => k.includes('.files.')).filter((k) => literals(en(k)).join('|') !== literals(fr(k)).join('|'));
    expect(different).toEqual([]);
  });

  it('the desk says vous; only journal decisions and ROOTLESS say tu', () => {
    const tu = /(?<!\p{L})(tu|t['’]|ton|ta|tes|toi)(?!\p{L})/iu;
    const flagged = missionKeys().filter((k) => !k.endsWith('.decision') && !k.includes('m05.files') && tu.test(fr(k))).map((k) => `${k}: ${fr(k)}`);
    expect(flagged).toEqual([]);
  });

  it('nothing written for the player assumes their gender', () => {
    const assumed = /(?<!\p{L})(vous (êtes|vous êtes) \p{L}+é|engagé|orienté|situé|relié|parti de)(?!\p{L})/iu;
    const flagged = writtenKeys().filter((k) => assumed.test(fr(k))).map((k) => `${k}: ${fr(k)}`);
    expect(flagged).toEqual([]);
  });
});

describe('voices stay recognisable', () => {
  const lines = (who: string, get: (k: string) => string) => by(who).map((s) => get(s.key));

  it('ROOTLESS: dashes for punctuation, no full stops or apostrophes in English, no accents in French', () => {
    expect(lines('ROOTLESS', en).filter((t) => /[.'](\s|$)/.test(t) && !/\.test/.test(t) || /'/.test(t))).toEqual([]);
    expect(lines('ROOTLESS', fr).filter((t) => /[àâäéèêëîïôöùûüç’]/i.test(t))).toEqual([]);
  });

  it('NULL and ECHO: correct punctuation and no emoji, except NULL on the night shift', () => {
    const night = new Set(['lg_fails.m.0', 'lg_fails.m.1']);
    for (const get of [en, fr]) {
      const all = [...by('NULL').filter((s) => !night.has(s.key)), ...by('ECHO')].filter((s) => !s.key.includes('fragment') && !s.key.includes('e1_fragment'));
      expect(all.filter((s) => EMOJI.test(get(s.key))).map((s) => s.key)).toEqual([]);
      expect(all.filter((s) => !/^[«"A-ZÀ-Ý0-9]/.test(get(s.key))).map((s) => s.key)).toEqual([]);
      expect(all.filter((s) => !/[.?!»"]$/.test(get(s.key)) && get(s.key) !== 'NULL').map((s) => s.key)).toEqual([]);
    }
  });

  it('the night shift really does slip, and is really noticed', () => {
    expect(en('lg_fails.m.0')).toMatch(/^[a-z]/);
    expect(fr('lg_fails.m.0')).toMatch(/^[a-zà-ÿ]/);
    expect(en('lg_fails.m.3')).toContain('not like you');
  });

  it('VANTA: lower case and shorthand, with her "ok so" and "bon alors" tic in each language', () => {
    expect(lines('VANTA', en).filter((t) => /^[A-Z]/.test(t) && !t.startsWith('I '))).toEqual([]);
    expect(lines('VANTA', en).filter((t) => t.includes('ok so')).length).toBeGreaterThan(4);
    expect(lines('VANTA', fr).filter((t) => t.includes('bon alors')).length).toBeGreaterThan(4);
    expect(lines('VANTA', fr).filter((t) => /^[A-ZÀ-Ý]/.test(t))).toEqual([]);
  });

  it('MOTH: full sentences with capitals, and never an emoji', () => {
    for (const get of [en, fr]) {
      const moth = lines('MOTH', get).filter((t) => t);
      expect(moth.filter((t) => EMOJI.test(t))).toEqual([]);
      expect(moth.filter((t) => !/^[A-ZÀ-Ý«"]/.test(t))).toEqual([]);
    }
  });

  it('French address: NULL and ECHO say vous to the player, the others say tu', () => {
    const tu = /(?<!\p{L})(tu|t['’]|ton|ta|tes|toi)(?!\p{L})/iu;
    expect(by('NULL').filter((s) => !s.key.startsWith('lg_')).map((s) => fr(s.key)).filter((t) => tu.test(t))).toEqual([]);
    expect(by('ECHO').map((s) => fr(s.key)).filter((t) => tu.test(t))).toEqual([]);
    for (const who of ['VANTA', 'MOTH', 'ROOTLESS', 'kelpie', 'ostrich_farm']) {
      const vous = by(who).filter((s) => !s.key.startsWith('lg_duel') && !s.key.startsWith('lg_m1') && !s.key.startsWith('lg_db') && !s.key.startsWith('lg_kelpie')).map((s) => fr(s.key)).filter((t) => /(?<!\p{L})vous(?!\p{L})/iu.test(t));
      expect(vous, who).toEqual([]);
    }
  });

  it('French never assumes the gender of the player', () => {
    const assumed = /(?<!\p{L})(pr[êe]te?|dou[ée]e?|parti|devenue?|moqu[ée]e?|nouveau venu|nouvelle venue)(?!\p{L})/iu;
    const toPlayer = [...neededKeys().filter((k) => !k.startsWith('char.') && !k.includes('.reply') && !k.includes('.label'))];
    const allowed = new Set(['end.record.p.fallout']);
    const flagged = toPlayer.filter((k) => assumed.test(fr(k)) && !allowed.has(k)).map((k) => `${k}: ${fr(k)}`);
    expect(flagged).toEqual([]);
  });
});
