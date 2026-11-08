import type { GameState } from '../game/types';

/**
 * The table: who stands where on Gramtele. ostrich_farm keeps it in #lowlight and everybody pretends not to read it.
 * Numbers match the accounts table in the metadata export (src/data/databases/gramtele-meta.ts).
 */
export const TABLE: { handle: string; standing: number }[] = [
  { handle: 'NULL', standing: 940 },
  { handle: 'VANTA', standing: 870 },
  { handle: 'MOTH', standing: 610 },
  { handle: 'kelpie', standing: 410 },
  { handle: 'tinsel', standing: 230 },
  { handle: 'ROOTLESS', standing: 120 },
  { handle: 'ostrich_farm', standing: 88 },
  { handle: 'ECHO', standing: 40 },
];

/** Public humiliations move people on the table too. */
const TABLE_LOSSES: { flag: string; handle: string; loss: number }[] = [
  { flag: 'mogged_kelpie', handle: 'kelpie', loss: 60 },
  { flag: 'corrected_moth', handle: 'MOTH', loss: 15 },
];

export const RANKS: { min: number; title: string }[] = [
  { min: 0, title: 'Nobody' },
  { min: 60, title: 'Noise' },
  { min: 150, title: 'Known handle' },
  { min: 300, title: 'Talked about' },
  { min: 450, title: 'A problem' },
  { min: 600, title: 'A reference' },
  { min: 800, title: 'Untouchable' },
];

export type Tier = 'low' | 'mid' | 'high';

export function rankOf(standing: number): { title: string; next: number | null } {
  const i = RANKS.reduce((best, r, n) => (standing >= r.min ? n : best), 0);
  return { title: RANKS[i].title, next: RANKS[i + 1]?.min ?? null };
}

/** How the scene treats the player when they speak off script. */
export function tierOf(standing: number): Tier {
  return standing >= 450 ? 'high' : standing >= 150 ? 'mid' : 'low';
}

export function standingOf(handle: string, flags: GameState['flags']): number {
  const base = TABLE.find((t) => t.handle === handle)?.standing ?? 0;
  return TABLE_LOSSES.reduce((n, l) => (l.handle === handle && flags[l.flag] ? n - l.loss : n), base);
}

export function tableFor(state: Pick<GameState, 'handle' | 'standing' | 'flags'>): { handle: string; standing: number; me: boolean }[] {
  return [...TABLE.map((t) => ({ handle: t.handle, standing: standingOf(t.handle, state.flags), me: false })), { handle: state.handle, standing: state.standing, me: true }]
    .sort((a, b) => b.standing - a.standing);
}

/** What a finished mission adds to standing, on top of its reward, for how it was done. */
export const CLEAN_BONUS = 20;
