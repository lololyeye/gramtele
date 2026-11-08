import type { Identity, VFS } from '../filesystem/vfs';
import type { Shell } from './shell';

export interface ManPage {
  /** One line: what the tool is for. Shown in field notes too. */
  name: string;
  synopsis: string[];
  description: string;
  options?: [string, string][];
  examples?: [string, string][];
  /** Why a professional cares. Shown in field notes. */
  why?: string;
}

export interface CmdCtx {
  argv: string[];
  stdin: string | null;
  isTty: boolean;
  sh: Shell;
  fs: VFS;
  id: Identity;
  out: (s: string) => void;
  err: (s: string) => void;
  /** Writes one line to stdout. */
  line: (s: string) => void;
  /** Prefixed error line: "<cmd>: msg". Always returns 1 for `return ctx.fail(...)`. */
  fail: (msg: string, code?: number) => number;
}

export interface Command {
  name: string;
  man: ManPage;
  /** Tool id that must be unlocked. Undefined means part of base system. */
  tool?: string;
  run: (ctx: CmdCtx) => number | Promise<number>;
}

/** Full-screen foreground program: less, man, top. */
export interface FullScreen {
  title: string;
  render: (rows: number) => string[];
  status: () => string;
  key: (key: string) => void;
  done: () => boolean;
  /** Called on a timer when defined (top). */
  tick?: () => void;
}

/** Line-oriented foreground program: sqlite3 shell. */
export interface LineProgram {
  prompt: () => string;
  /** Returns text to print. */
  input: (line: string) => Promise<string> | string;
  done: () => boolean;
}

// ---------- signals the shell emits for the game layer ----------

export type ShellEvent =
  | { t: 'cmd'; name: string; argv: string[]; raw: string; exit: number; host: string; cwd: string; stages: string[] }
  | { t: 'read'; host: string; path: string }
  | { t: 'fs'; host: string; op: string; path: string }
  | { t: 'ssh'; host: string };

/** What the shell needs from the outside world. Implemented by GameEngine. */
export interface ShellHost {
  now: () => number;
  emit: (e: ShellEvent) => void;
  isToolUnlocked: (tool: string) => boolean;
  fileSystem: (host: string) => VFS;
  /** Used by "game" commands (submit, evidence, dossier...). */
  services: Record<string, unknown>;
}
