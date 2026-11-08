import { ui } from '../i18n';
/**
 * Save system: versioned JSON in localStorage, three slots plus autosave. Imported data is
 * untrusted, so it is validated structurally before it can reach the engine.
 */
import { DEFAULT_SETTINGS, newState, SAVE_VERSION } from './engine';
import type { DirNode, VNode } from './filesystem/vfs';
import type { GameState } from './types';

export type SlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';
export const SLOTS: SlotId[] = ['auto', 'slot1', 'slot2', 'slot3'];

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const key = (s: SlotId) => `gramtele.save.${s}`;

export interface SlotInfo {
  slot: SlotId;
  handle: string;
  xp: number;
  mission: string | null;
  savedAt: number;
}

function validNode(n: unknown, depth = 0): n is VNode {
  if (typeof n !== 'object' || n === null || depth > 64) return false;
  const o = n as Record<string, unknown>;
  if (typeof o.mode !== 'number' || typeof o.uid !== 'number' || typeof o.gid !== 'number' || typeof o.mtime !== 'number') return false;
  if (o.k === 'f') return o.data === undefined || typeof o.data === 'string';
  if (o.k === 'l') return typeof o.target === 'string';
  if (o.k === 'd') {
    if (typeof o.c !== 'object' || o.c === null) return false;
    return Object.entries(o.c as Record<string, unknown>).every(([name, c]) => !name.includes('/') && name !== '__proto__' && validNode(c, depth + 1));
  }
  return false;
}

/** Returns a safe state, or an error message. Unknown fields fall back to defaults. */
export function validateSave(raw: unknown): { state: GameState } | { error: string } {
  if (typeof raw !== 'object' || raw === null) return { error: ui('not_a_save_file') };
  const o = raw as Partial<GameState>;
  if (typeof o.version !== 'number') return { error: ui('save_has_no_version') };
  if (o.version > SAVE_VERSION) return { error: ui('save_was_made_by_a') };
  if (typeof o.handle !== 'string' || !/^[a-zA-Z0-9_-]{0,24}$/.test(o.handle)) return { error: ui('invalid_handle_in_save') };
  if (typeof o.xp !== 'number' || !Number.isFinite(o.xp) || o.xp < 0) return { error: ui('invalid_xp_in_save') };
  if (typeof o.flags !== 'object' || typeof o.missions !== 'object' || typeof o.threads !== 'object') return { error: ui('save_is_missing_game_state') };
  const lists: (keyof GameState)[] = ['firedBeats', 'pendingMessages', 'pendingChoices', 'tools', 'skills', 'achievements', 'evidence', 'journal', 'shellHistory'];
  for (const k of lists) if (o[k] !== undefined && !Array.isArray(o[k])) return { error: `Save has an invalid ${k} list.` };
  for (const t of Object.values(o.threads ?? {})) if (!Array.isArray(t?.messages)) return { error: ui('save_has_an_invalid_conversation') };
  for (const m of Object.values(o.missions ?? {})) if (!Array.isArray(m?.objectives) || !Array.isArray(m?.optionals)) return { error: ui('save_has_an_invalid_mission') };
  const fs = o.fs as Record<string, DirNode> | undefined;
  if (fs && !Object.values(fs).every((root) => validNode(root) && root.k === 'd')) return { error: ui('save_contains_an_invalid_filesystem') };
  const base = newState();
  for (const t of Object.values(o.threads ?? {})) {
    if (t.pinnedMessages !== undefined && !Array.isArray(t.pinnedMessages)) t.pinnedMessages = undefined;
    for (const m of t.messages) if (m.reactions !== undefined && !Array.isArray(m.reactions)) m.reactions = undefined;
  }
  const state: GameState = { ...base, ...o, settings: { ...DEFAULT_SETTINGS, ...(o.settings ?? {}), sound: { ...DEFAULT_SETTINGS.sound, ...(o.settings?.sound ?? {}) } }, seen: { ...base.seen, ...(o.seen ?? {}) } } as GameState;
  return { state };
}

export class SaveStore {
  constructor(private kv: KV) {}

  save(slot: SlotId, state: GameState): { ok: boolean; error?: string } {
    try {
      this.kv.setItem(key(slot), JSON.stringify({ savedAt: Date.now(), state }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  load(slot: SlotId): { state: GameState } | { error: string } | null {
    const raw = this.kv.getItem(key(slot));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return validateSave(parsed.state);
    } catch {
      return { error: ui('save_data_is_corrupted') };
    }
  }

  info(slot: SlotId): SlotInfo | null {
    const raw = this.kv.getItem(key(slot));
    if (!raw) return null;
    try {
      const p = JSON.parse(raw);
      return { slot, handle: p.state.handle, xp: p.state.xp, mission: p.state.activeMission, savedAt: p.savedAt };
    } catch {
      return null;
    }
  }

  remove(slot: SlotId): void {
    this.kv.removeItem(key(slot));
  }

  export(state: GameState): string {
    return JSON.stringify({ game: 'gramtele', state }, null, 0);
  }

  import(text: string): { state: GameState } | { error: string } {
    try {
      const p = JSON.parse(text);
      return validateSave(p.state ?? p);
    } catch {
      return { error: ui('that_file_is_not_valid') };
    }
  }
}
