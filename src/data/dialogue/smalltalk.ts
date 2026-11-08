import type { Msg, ThreadId } from '../../game/types';
import { lineKey } from '../../i18n';
import type { Tier } from '../reputation';

/**
 * What people say when the player writes something the story did not ask for.
 * The scene answers according to the player's standing, so respect is audible.
 * These lines never mention anything the speaker should not know yet, and they change nothing:
 * the suggested replies stay open, and only those move the story.
 */

/** How many lines each thread has per tier. Tiers left out use the low pool: ECHO talks to everyone alike. */
export const SMALL_COUNTS: Partial<Record<ThreadId, Partial<Record<Tier, number>>>> = {
  NULL: { low: 5, mid: 4, high: 4 },
  VANTA: { low: 4, mid: 4, high: 4 },
  MOTH: { low: 5, mid: 4, high: 4 },
  ROOTLESS: { low: 5, mid: 4, high: 4 },
  ECHO: { low: 3 },
  lowlight: { low: 4, mid: 4, high: 4 },
};

/** Who says each line in the group, by tier. */
export const GROUP_SPEAKERS: Record<Tier, NonNullable<Msg['from']>[]> = {
  low: ['kelpie', 'tinsel', 'ostrich_farm', 'ROOTLESS'],
  mid: ['kelpie', 'tinsel', 'ostrich_farm', 'ROOTLESS'],
  high: ['kelpie', 'tinsel', 'ostrich_farm', 'MOTH'],
};

export const FILE_COUNTS: Partial<Record<ThreadId, number>> = { NULL: 2, VANTA: 2, MOTH: 2, ROOTLESS: 2, ECHO: 1, lowlight: 2 };
const FILE_SPEAKERS: NonNullable<Msg['from']>[] = ['tinsel', 'kelpie'];

export function smalltalkFor(thread: ThreadId, n: number, attachment: boolean, tier: Tier = 'low'): Msg | null {
  if (attachment) {
    const count = FILE_COUNTS[thread];
    if (!count) return null;
    const i = n % count;
    return { text: lineKey(`file.${thread}.${i}`), ...(thread === 'lowlight' ? { from: FILE_SPEAKERS[i] } : {}) };
  }
  const counts = SMALL_COUNTS[thread];
  if (!counts) return null;
  const use = counts[tier] ? tier : 'low';
  const count = counts[use];
  if (!count) return null;
  const i = n % count;
  return { text: lineKey(`small.${thread}.${use}.${i}`), ...(thread === 'lowlight' ? { from: GROUP_SPEAKERS[use][i] } : {}) };
}

/** Who may acknowledge the player's message with a reaction, and with what. NULL and ECHO do not. */
export const CHAT_REACTIONS: Partial<Record<ThreadId, { from: string; emoji: string[] }>> = {
  VANTA: { from: 'VANTA', emoji: ['👍', '📝', '👀'] },
  MOTH: { from: 'MOTH', emoji: ['🔥', '😏', '👀'] },
  ROOTLESS: { from: 'ROOTLESS', emoji: ['💀', '🫡'] },
  lowlight: { from: 'tinsel', emoji: ['😂', '👀', '💀'] },
};
