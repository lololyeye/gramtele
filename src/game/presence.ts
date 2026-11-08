import type { Character } from './types';

const HOUR = 3_600_000;

export interface Presence {
  online: boolean;
  /** When this person was last around, in story time. Null for people with no regular hours. */
  lastSeen: number | null;
}

/** Derived from each character's usual hours and the story clock, so it stays true across saves. */
export function presenceOf(c: Character, now: number): Presence {
  if (!c.online) return { online: false, lastSeen: null };
  const [from, to] = c.online;
  const hour = new Date(now).getUTCHours();
  if (hour >= from && hour <= to) return { online: true, lastSeen: now };
  const midnight = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const endToday = midnight + (to + 1) * HOUR - 4 * 60_000;
  return { online: false, lastSeen: endToday <= now ? endToday : endToday - 24 * HOUR };
}
