import { localeTag, tr } from '../i18n';
import { CHARACTERS } from '../data/characters';
import type { ThreadId } from '../game/types';

/** All story times are UTC, so every formatter below pins that zone. */
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(localeTag(), { timeZone: 'UTC', ...o });

const DAY = 86_400_000;
const dayIndex = (t: number) => Math.floor(t / DAY);

export function timeOf(at: number): string {
  return fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(at);
}

export function dayLabel(at: number, now: number): string {
  const diff = dayIndex(now) - dayIndex(at);
  if (diff === 0) return tr('Today');
  if (diff === 1) return tr('Yesterday');
  return fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(at);
}

export function listStamp(at: number, now: number): string {
  const diff = dayIndex(now) - dayIndex(at);
  if (diff === 0) return timeOf(at);
  if (diff === 1) return tr('Yesterday');
  if (diff < 7) return fmt({ weekday: 'short' }).format(at);
  return fmt({ day: '2-digit', month: '2-digit' }).format(at);
}

export function dateTime(at: number): string {
  return fmt({ day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(at);
}

export function realDateTime(at: number): string {
  return new Intl.DateTimeFormat(localeTag(), { dateStyle: 'medium', timeStyle: 'short' }).format(at);
}

export function lastSeenLabel(lastSeen: number | null, now: number): string {
  if (lastSeen === null) return tr('offline');
  const diff = dayIndex(now) - dayIndex(lastSeen);
  if (diff === 0) return tr('last seen today at {time}', { time: timeOf(lastSeen) });
  if (diff === 1) return tr('last seen yesterday at {time}', { time: timeOf(lastSeen) });
  return tr('last seen {date}', { date: fmt({ day: 'numeric', month: 'short' }).format(lastSeen) });
}

export function senderName(from: string): string {
  return from in CHARACTERS ? tr(CHARACTERS[from as ThreadId].handle) : from;
}

export function usernameOf(id: ThreadId): string {
  const c = CHARACTERS[id];
  return c.kind === 'group' ? c.handle : `@${id.toLowerCase()}`;
}

export function shortPath(path: string): string {
  return path.replace('/home/player', '~');
}
