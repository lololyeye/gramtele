import type { Tier } from '../reputation';
import type { EndingId, ThreadId } from '../../game/types';

/** The shape of one language's writing. en.ts and fr.ts each fill it in, and share nothing else. */
export interface ChoiceText {
  label: string;
  /** What appears as the player's own message. Defaults to the label. */
  reply?: string;
  decision?: string;
  then?: string[];
  journal?: string[];
}

export interface SceneText {
  m: string[];
  c?: Record<string, ChoiceText>;
  journal?: string[];
}

export interface CharacterText {
  tagline: string;
  joined: string;
  bio: string[];
  /** Profile notes, by the flag that reveals them. */
  reveals?: Record<string, { label: string; value: string }>;
}

export interface EndingText {
  title: string;
  epigraph: string;
  p: Record<string, string>;
}

export interface DialogueSet {
  scenes: Record<string, SceneText>;
  /** Off-script replies. A thread may leave mid and high out when its voice does not change with standing. */
  small: Partial<Record<ThreadId, Partial<Record<Tier, string[]>>>>;
  /** Replies to a file the player sent. */
  files: Partial<Record<ThreadId, string[]>>;
  characters: Partial<Record<ThreadId, CharacterText>>;
  endings: Record<EndingId, EndingText>;
  misc: Record<string, string>;
}

/** Turns one language's writing into flat keys. */
export function flatten(set: DialogueSet): Map<string, string> {
  const out = new Map<string, string>();
  const list = (prefix: string, rows: string[] | undefined) => rows?.forEach((t, i) => out.set(`${prefix}.${i}`, t));
  for (const [id, s] of Object.entries(set.scenes)) {
    list(`${id}.m`, s.m);
    list(`${id}.j`, s.journal);
    for (const [cid, c] of Object.entries(s.c ?? {})) {
      const p = `${id}.c.${cid}`;
      out.set(`${p}.label`, c.label);
      out.set(`${p}.reply`, c.reply ?? c.label);
      if (c.decision) out.set(`${p}.decision`, c.decision);
      list(`${p}.then`, c.then);
      list(`${p}.j`, c.journal);
    }
  }
  for (const [thread, tiers] of Object.entries(set.small)) {
    for (const [tier, rows] of Object.entries(tiers ?? {})) list(`small.${thread}.${tier}`, rows);
  }
  for (const [thread, rows] of Object.entries(set.files)) list(`file.${thread}`, rows);
  for (const [id, c] of Object.entries(set.characters)) {
    out.set(`char.${id}.tagline`, c.tagline);
    out.set(`char.${id}.joined`, c.joined);
    list(`char.${id}.bio`, c.bio);
    for (const [flag, r] of Object.entries(c.reveals ?? {})) {
      out.set(`char.${id}.reveal.${flag}.label`, r.label);
      out.set(`char.${id}.reveal.${flag}.value`, r.value);
    }
  }
  for (const [id, e] of Object.entries(set.endings)) {
    out.set(`end.${id}.title`, e.title);
    out.set(`end.${id}.epigraph`, e.epigraph);
    for (const [k, t] of Object.entries(e.p)) out.set(`end.${id}.p.${k}`, t);
  }
  for (const [k, t] of Object.entries(set.misc)) out.set(`misc.${k}`, t);
  return out;
}
