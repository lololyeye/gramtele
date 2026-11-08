import type { DirNode, SeedFile } from './filesystem/vfs';

export type SkillId = 'linux' | 'networking' | 'osint' | 'databases' | 'websec' | 'forensics' | 'ir' | 'fundamentals';

export type CharacterId = 'NULL' | 'VANTA' | 'MOTH' | 'ROOTLESS' | 'ECHO';
export type ThreadId = CharacterId | 'lowlight' | 'lowtide';

export interface Character {
  id: ThreadId;
  handle: string;
  kind: 'contact' | 'group' | 'archive';
  tagline: string;
  joined: string;
  standing: number;
  bio: string[];
  /** Fields the profile reveals once the flag is set. */
  reveals?: { flag: string; label: string; value: string }[];
  /** Quiet hours: online between these UTC hours. */
  online?: [number, number];
  members?: string[];
}

// ---------- conditions and effects ----------

export type Cond =
  | { flag: string }
  | { not: Cond }
  | { all: Cond[] }
  | { any: Cond[] }
  | { missionDone: string }
  | { missionActive: string }
  | { rel: [CharacterId, number] }
  | { evidence: string }
  | { beat: string }
  | { objectiveDone: [string, string] }
  | { optionalDone: [string, string] }
  | { signal: string };

export type Effect =
  | { flag: string }
  | { unflag: string }
  | { rel: [CharacterId, number] }
  | { standing: number }
  | { credits: number }
  | { offer: string }
  | { accept: string }
  | { evidence: string }
  | { tool: string }
  | { journal: string; kind?: JournalKind }
  | { ending: EndingId }
  | { achievement: string }
  | { fileTo: { host: string; file: SeedFile } };

export type JournalKind = 'story' | 'decision' | 'finding' | 'note' | 'system';

// ---------- narrative ----------

export interface Attachment {
  name: string;
  kind: 'text' | 'file' | 'photo';
  /** What Inspect shows. */
  preview: string;
  /** Saved to ~/Downloads when the player takes it. */
  file?: SeedFile;
}

export interface Msg {
  from?: ThreadId | 'tinsel' | 'kelpie' | 'ostrich_farm' | 'sys';
  text: string;
  if?: Cond;
  attachment?: Attachment;
  /** Typing pause before this message, ms. Defaults from length. */
  delay?: number;
  /** Mission invitation card. */
  invite?: string;
}

export interface Choice {
  id: string;
  label: string;
  /** Text that appears as the player's own message. Defaults to label. */
  reply?: string;
  if?: Cond;
  effects?: Effect[];
  /** Replies delivered immediately after this choice. */
  then?: Msg[];
  /** Stays open after use: the beat's other choices remain available. */
  keep?: boolean;
  /** A choice that matters, marked in the journal. */
  decision?: string;
}

export interface Beat {
  id: string;
  thread: ThreadId;
  when: Cond;
  /** Wait before the first message, ms. */
  delay?: number;
  messages: Msg[];
  choices?: Choice[];
  effects?: Effect[];
  /** Asks for the contact request card first. */
  contactRequest?: boolean;
}

export interface ChatMessage {
  id: number;
  from: string;
  text: string;
  at: number;
  attachment?: Attachment;
  invite?: string;
  taken?: boolean;
}

export interface ThreadState {
  messages: ChatMessage[];
  unread: number;
  archived: boolean;
  visible: boolean;
}

export interface PendingMessage {
  thread: ThreadId;
  msg: Msg;
  dueAt: number;
}

export interface PendingChoice {
  beatId: string;
  thread: ThreadId;
  contactRequest?: boolean;
}

// ---------- missions ----------

export type Check =
  | { kind: 'cmd'; name: string; args?: string; host?: string; ok?: boolean }
  | { kind: 'pipeline'; stages: string[]; args?: string }
  | { kind: 'read'; path: string; host?: string }
  | { kind: 'http'; host: string; path?: string; status?: number; method?: string; via?: 'curl' | 'browser' | 'wget' }
  | { kind: 'dns'; name?: string; type?: string }
  | { kind: 'probe'; probe: 'ping' | 'traceroute' | 'nmap' | 'whois'; target?: string }
  | { kind: 'sql'; db: string; match?: string; result?: string; minRows?: number }
  | { kind: 'signal'; id: string }
  | { kind: 'answer'; key: string }
  | { kind: 'file'; path: string; host?: string; contains?: string; mode?: number; tag?: string }
  | { kind: 'evidence'; id: string }
  | { kind: 'report' }
  | { kind: 'cwd'; path: string; host?: string }
  | { kind: 'sealed' }
  | { kind: 'all'; of: Check[] }
  | { kind: 'any'; of: Check[] };

export interface AnswerDef {
  key: string;
  prompt: string;
  accept: string[];
  /** Shown when wrong, without giving it away. */
  wrong?: string;
  /** Shown when right: why this is the answer. */
  right?: string;
  placeholder?: string;
}

export interface Objective {
  id: string;
  text: string;
  /** Why this matters; shown in the panel. */
  note?: string;
  check: Check;
  answer?: AnswerDef;
  /** Further findings the same objective asks for. */
  extraAnswers?: AnswerDef[];
  xp: number;
  skill: SkillId;
  hints: [string, string, string];
  effects?: Effect[];
}

export interface OptionalDiscovery {
  id: string;
  title: string;
  text: string;
  check: Check;
  xp: number;
  skill: SkillId;
  effects?: Effect[];
}

export interface ReportChoice {
  id: string;
  text: string;
  correct?: boolean;
  /** Why this is right or wrong, shown after filing. */
  why: string;
}

export type ReportSection =
  | { kind: 'choice'; id: string; title: string; prompt: string; options: ReportChoice[] }
  | { kind: 'order'; id: string; title: string; prompt: string; items: { id: string; text: string }[]; correct: string[] }
  | { kind: 'decision'; id: string; title: string; prompt: string; options: { id: string; text: string; effects?: Effect[]; decision: string }[] };

export interface ReportDef {
  title: string;
  intro: string;
  sections: ReportSection[];
  /** Minimum share of graded sections that must be right to file. */
  passMark: number;
}

export interface Mission {
  id: string;
  chapter: number;
  chapterTitle: string;
  title: string;
  contact: CharacterId;
  difficulty: 1 | 2 | 3 | 4 | 5;
  minutes: number;
  requires: string[];
  intro: string[];
  concepts: { term: string; text: string }[];
  resources: string[];
  environment: string;
  tools: string[];
  files?: { host: string; file: SeedFile }[];
  objectives: Objective[];
  optionals: OptionalDiscovery[];
  report?: ReportDef;
  /** Story clock the mission begins at. */
  clock: string;
  rewards: { xp: number; credits: number; standing: number };
  review: {
    accomplished: string;
    concepts: string[];
    why: string;
    professional: string;
    defend: string[];
  };
  onComplete?: Effect[];
}

export interface MissionProgress {
  status: 'offered' | 'active' | 'done' | 'declined';
  objectives: string[];
  optionals: string[];
  answers: Record<string, string>;
  wrong: { key: string; value: string }[];
  hints: Record<string, number>;
  reportDone?: boolean;
  reportScore?: number;
  reportWrong?: string[];
  acceptedAt?: number;
  finishedAt?: number;
  commands: number;
}

// ---------- progression ----------

export type SkillCheck =
  | { cmd: string; args?: string; times?: number }
  | { stages: number }
  | { signal: string }
  | { objective: string }
  | { optional: string }
  | { sql: string }
  | { reportsFiled: number };

export interface SkillNode {
  id: string;
  skill: SkillId;
  title: string;
  text: string;
  requires: string[];
  check: SkillCheck;
}

export interface Achievement {
  id: string;
  title: string;
  text: string;
  hidden?: boolean;
}

export interface EvidenceDef {
  id: string;
  title: string;
  summary: string;
  source: string;
  /** Required in the final dossier. */
  exhibit?: boolean;
  links?: string[];
}

export interface EvidenceRecord {
  id: string;
  title: string;
  summary: string;
  source: string;
  hash: string | null;
  at: number;
  path?: string;
}

export type EndingId = 'seat' | 'record' | 'custody' | 'leverage' | 'ghost';

export interface JournalEntry {
  at: number;
  kind: JournalKind;
  text: string;
}

export interface Toast {
  id: number;
  kind: 'message' | 'objective' | 'mission' | 'level' | 'achievement' | 'skill' | 'evidence' | 'system';
  title: string;
  body?: string;
  thread?: ThreadId;
}

export interface FieldNote {
  command: string;
  at: number;
}

export interface Settings {
  sound: { master: number; ui: number; keys: number; ambient: number; muted: boolean };
  reducedMotion: 'auto' | 'on' | 'off';
  fontScale: number;
  fieldNotes: boolean;
  typingSpeed: 'normal' | 'instant';
}

export interface Stats {
  commands: number;
  cmd: Record<string, number>;
  maxStages: number;
  failed: number;
  sqlQueries: number;
  reportsFiled: number;
  hintsUsed: number;
}

/** All persistent game state. Plain JSON. */
export interface GameState {
  version: number;
  handle: string;
  startedAt: number;
  clockBase: number;
  playMs: number;
  xp: number;
  credits: number;
  standing: number;
  flags: Record<string, boolean>;
  signals: Record<string, number>;
  relationships: Record<CharacterId, number>;
  missions: Record<string, MissionProgress>;
  activeMission: string | null;
  firedBeats: string[];
  threads: Record<string, ThreadState>;
  pendingMessages: PendingMessage[];
  pendingChoices: PendingChoice[];
  nextMsgId: number;
  tools: string[];
  skills: string[];
  achievements: string[];
  evidence: EvidenceRecord[];
  journal: JournalEntry[];
  seenCommands: string[];
  fieldNotes: FieldNote[];
  httpLog: { host: string; path: string; status: number; at: number }[];
  discoveredHosts: string[];
  cookies: Record<string, Record<string, string>>;
  siteStore: Record<string, Record<string, unknown>>;
  fs: Record<string, DirNode>;
  shellHistory: string[];
  cwd: string;
  sealed: boolean;
  ending: EndingId | null;
  /** Network probes and DNS names seen, for the checks. */
  seen: {
    dns: string[];
    probes: string[];
    http: string[];
    reads: string[];
    cmds: string[];
    pipes: string[];
  };
  settings: Settings;
  browserHome: string;
  stats?: Stats;
}
