/**
 * Connects React to the engine: one running game, its saves, the terminal scrollback,
 * and the clock that delivers messages.
 */
import { createContext, ReactNode, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { GameEngine, newState } from '../game/engine';
import { KV, SaveStore, SlotId } from '../game/persistence';
import type { GameState, ThreadId } from '../game/types';
import { audio } from './audio';

export type ViewId = 'terminal' | 'gramtele' | 'missions' | 'network' | 'evidence' | 'skills' | 'inventory' | 'journal' | 'settings';

export interface TermLine {
  id: number;
  prompt?: string;
  text: string;
}

const memoryKv = (): KV => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

function safeStorage(): KV {
  try {
    const probe = '__gramtele_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryKv();
  }
}

/** Long-lived object behind the React tree. */
export class Session {
  engine: GameEngine;
  store = new SaveStore(safeStorage());
  scrollback: TermLine[] = [];
  draft = '';
  view: ViewId = 'gramtele';
  thread: ThreadId = 'NULL';
  missionFocus: string | null = null;
  drawerOpen = false;
  saveError: string | null = null;
  private lineId = 1;
  private listeners = new Set<() => void>();
  private version = 0;
  private unsub: () => void = () => undefined;
  private soundedToasts = 0;

  constructor(state: GameState = newState()) {
    this.engine = new GameEngine(state);
    this.attach();
  }

  private attach() {
    this.unsub();
    this.soundedToasts = 0;
    this.unsub = this.engine.subscribe(() => {
      this.playToastSounds();
      this.notify();
    });
    audio.apply(this.engine.state.settings.sound);
  }

  private playToastSounds() {
    const last = this.engine.toasts.at(-1);
    if (last && last.id > this.soundedToasts) {
      this.soundedToasts = last.id;
      audio.play(last.kind === 'message' ? 'message' : 'notify');
    }
  }

  replace(state: GameState) {
    this.engine = new GameEngine(state);
    this.scrollback = [];
    this.draft = '';
    this.view = state.handle ? 'gramtele' : 'terminal';
    this.drawerOpen = false;
    this.attach();
    this.notify();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };
  snapshot = () => this.version;
  notify() {
    this.version++;
    for (const l of this.listeners) l();
  }

  go(view: ViewId) {
    this.view = view;
    this.drawerOpen = false;
    this.notify();
  }
  openThread(t: ThreadId) {
    this.thread = t;
    this.go('gramtele');
  }
  openMission(id: string) {
    this.missionFocus = id;
    this.go('missions');
  }
  toggleDrawer() {
    if (this.view === 'terminal') return;
    this.drawerOpen = !this.drawerOpen;
    this.notify();
  }

  print(text: string, prompt?: string) {
    this.scrollback.push({ id: this.lineId++, text, prompt });
    if (this.scrollback.length > 1500) this.scrollback.splice(0, this.scrollback.length - 1500);
    this.notify();
  }
  clearScreen() {
    this.scrollback = [];
    this.notify();
  }

  autosave() {
    if (!this.engine.state.handle) return;
    const r = this.store.save('auto', this.engine.state);
    this.saveError = r.ok ? null : r.error ?? 'Could not save.';
  }
  save(slot: SlotId) {
    const r = this.store.save(slot, this.engine.state);
    this.saveError = r.ok ? null : r.error ?? 'Could not save.';
    this.notify();
    return r;
  }
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
  useEffect(() => {
    const t = window.setInterval(() => session.engine.tick(), 250);
    const save = window.setInterval(() => session.autosave(), 12000);
    const flush = () => session.autosave();
    const hidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.clearInterval(t);
      window.clearInterval(save);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [session]);
  return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}

/** Current session; the component re-renders whenever the game changes. */
export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  useSyncExternalStore(s.subscribe, s.snapshot);
  return s;
}

/** Formats a story-clock timestamp. */
export function clock(at: number, withDate = false): string {
  const iso = new Date(at).toISOString();
  return withDate ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : iso.slice(11, 16);
}

export function useReducedMotion(pref: 'auto' | 'on' | 'off'): boolean {
  return useMemo(() => {
    if (pref === 'on') return true;
    if (pref === 'off') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, [pref]);
}
