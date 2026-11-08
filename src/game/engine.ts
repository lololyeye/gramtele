/**
 * GameEngine ties the systems together: shell, virtual network, databases, missions,
 * narrative and progression. It has no React in it and can be played headlessly.
 */
import { CHARACTERS } from '../data/characters';
import { gramteleMetaSeed } from '../data/databases/gramtele-meta';
import { nexusArchiveSeed } from '../data/databases/nexus-archive';
import { BEATS, WORLD_RULES } from '../data/dialogue';
import { MISSION_BY_ID, MISSIONS } from '../data/missions';
import { ACHIEVEMENTS, EVIDENCE, SKILL_NODES } from '../data/progression';
import { HOST_PROFILES, PROCESSES, seedWorkbench } from '../data/world/hosts';
import { DNS, HOSTS, WHOIS } from '../data/world/network';
import { buildSites } from '../data/world/sites';
import { ALL_COMMANDS, HELP_GROUPS } from './commands';
import { QuerySet, DbEngine } from './databases/engine';
import type { GameApi } from './commands/game';
import { DirNode, FileNode, installFile, normalize, ROOT, SeedFile, VFS } from './filesystem/vfs';
import { Shell } from './terminal/shell';
import type { ShellEvent, ShellHost } from './terminal/types';
import type {
  AnswerDef, Beat, ChatMessage, CharacterId, Check, Choice, Cond, Effect, FieldNote, GameState, JournalKind, Mission, MissionProgress, Msg,
  Objective, ReportDef, Settings, SkillCheck, Stats, ThreadId, Toast,
} from './types';
import { NetEvent, VirtualNet } from './virtual-network/net';

export const SAVE_VERSION = 1;
const START_CLOCK = Date.parse('2026-10-12T21:47:00Z');

export function levelFor(xp: number): number {
  return Math.floor(Math.sqrt(xp / 60)) + 1;
}
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 60;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: { master: 0.7, ui: 0.6, keys: 0.3, ambient: 0.3, muted: true },
  reducedMotion: 'auto',
  fontScale: 1,
  fieldNotes: true,
  typingSpeed: 'normal',
};

export function newState(): GameState {
  return {
    version: SAVE_VERSION,
    handle: '',
    startedAt: START_CLOCK,
    clockBase: START_CLOCK,
    playMs: 0,
    xp: 0,
    credits: 0,
    standing: 0,
    flags: {},
    signals: {},
    relationships: { NULL: 0, VANTA: 0, MOTH: 0, ROOTLESS: 0, ECHO: 0 },
    missions: {},
    activeMission: null,
    firedBeats: [],
    threads: {},
    pendingMessages: [],
    pendingChoices: [],
    nextMsgId: 1,
    tools: [],
    skills: [],
    achievements: [],
    evidence: [],
    journal: [],
    seenCommands: [],
    fieldNotes: [],
    httpLog: [],
    discoveredHosts: [],
    cookies: {},
    siteStore: {},
    fs: {},
    shellHistory: [],
    cwd: '/home/player',
    sealed: false,
    ending: null,
    seen: { dns: [], probes: [], http: [], reads: [], cmds: [], pipes: [] },
    settings: structuredClone(DEFAULT_SETTINGS),
    browserHome: 'http://search.test/',
  };
}

const normAnswer = (s: string) => s.trim().toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ');

export interface ReportResponses {
  [sectionId: string]: string | string[];
}

export interface ReportResult {
  passed: boolean;
  score: number;
  feedback: { section: string; correct: boolean | null; text: string }[];
}

export class GameEngine implements GameApi {
  state: GameState;
  shell: Shell;
  net: VirtualNet;
  db: DbEngine;
  toasts: Toast[] = [];
  private toastId = 1;
  private listeners = new Set<() => void>();
  private fsMap = new Map<string, VFS>();
  private realNow: () => number;
  private version = 0;
  private lastTick = 0;
  private busyEval = false;
  private evalAgain = false;

  constructor(state: GameState = newState(), opts: { realNow?: () => number } = {}) {
    this.state = state;
    this.realNow = opts.realNow ?? (() => Date.now());
    this.lastTick = this.realNow();
    this.db = new DbEngine({
      nexus_archive: nexusArchiveSeed,
      gramtele_meta: () => gramteleMetaSeed(this.state.handle || 'c-0047'),
    });
    this.net = new VirtualNet(
      { hosts: HOSTS, dns: DNS, sites: buildSites(), whois: WHOIS },
      {
        flag: (f) => !!this.state.flags[f],
        signal: (id) => this.signal(id),
        now: () => this.now(),
        store: this.state.siteStore,
        handle: () => this.state.handle,
      },
      (e) => this.onNetEvent(e),
      { get: (host) => this.state.cookies[host] ?? {} },
    );
    const host: ShellHost = {
      now: () => this.now(),
      emit: (e) => this.onShellEvent(e),
      isToolUnlocked: (t) => this.state.tools.includes(t),
      fileSystem: (h) => this.fileSystem(h),
      services: {
        net: this.net,
        db: this.db,
        game: this,
        helpGroups: HELP_GROUPS,
        processes: (h: string) => PROCESSES[h] ?? [],
        onSql: (db: string, sql: string, r: QuerySet) => this.onSql(db, sql, r),
      },
    };
    this.shell = new Shell(host, ALL_COMMANDS, structuredClone(HOST_PROFILES.workbench));
    this.shell.history = [...state.shellHistory];
    const fs = this.fileSystem('workbench');
    if (fs.isDir(state.cwd)) this.shell.setCwd(state.cwd);
  }

  // ---------- infrastructure ----------

  now(): number {
    return this.state.clockBase + this.state.playMs;
  }

  fileSystem(hostname: string): VFS {
    let fs = this.fsMap.get(hostname);
    if (fs) return fs;
    const saved = this.state.fs[hostname] as DirNode | undefined;
    fs = new VFS(
      {
        now: () => this.now(),
        resolve: () => '',
        onRead: (path) => this.onShellEvent({ t: 'read', host: hostname, path }),
        onChange: (op, path) => this.onShellEvent({ t: 'fs', host: hostname, op, path }),
      },
      saved,
    );
    if (!saved) {
      if (hostname === 'workbench') {
        const hooks = fs.hooks;
        const onRead = hooks.onRead;
        hooks.onRead = undefined;
        seedWorkbench(fs);
        hooks.onRead = onRead;
      }
      this.state.fs[hostname] = fs.root;
    }
    this.fsMap.set(hostname, fs);
    return fs;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getVersion(): number {
    return this.version;
  }

  private changed(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  // ---------- starting ----------

  signUp(handle: string): void {
    this.state.handle = handle;
    this.state.flags.signed_up = true;
    this.state.threads.NULL ??= { messages: [], unread: 0, archived: false, visible: true };
    this.addJournal('Created a Gramtele account. Nothing about this felt important at the time.', 'story');
    this.pump();
    this.changed();
  }

  // ---------- terminal ----------

  /** Runs one line, as if typed at the prompt. */
  async runCommand(line: string): Promise<string> {
    const raw = line.trim();
    const res = await this.shell.exec(line);
    if (raw) {
      this.appendAudit(raw);
      const active = this.activeProgress();
      if (active) active.commands++;
      this.award('first_blood');
    }
    this.state.shellHistory = this.shell.history.slice(-400);
    this.state.cwd = this.shell.cwd;
    this.evaluate();
    this.changed();
    return res.output;
  }

  /** After an interactive sqlite3 line. */
  afterProgramInput(): void {
    this.evaluate();
    this.changed();
  }

  private appendAudit(raw: string): void {
    const fs = this.fileSystem('workbench');
    const path = '/var/log/workbench/audit.log';
    const node = fs.lookup(path) as FileNode | null;
    if (!node) return;
    const stamp = new Date(this.now()).toISOString().replace('.000', '');
    const lines = (node.data ?? '').split('\n').filter(Boolean);
    lines.push(`${stamp} c-0047 tty=pts/0 ${raw}`);
    node.data = lines.slice(-800).join('\n') + '\n';
    node.mtime = this.now();
  }

  private pushCapped(list: string[], item: string, cap = 1500): void {
    if (list.includes(item)) return;
    list.push(item);
    if (list.length > cap) list.shift();
  }

  private onShellEvent(e: ShellEvent): void {
    const seen = this.state.seen;
    if (e.t === 'read') {
      this.pushCapped(seen.reads, `${e.host}:${normalize(e.path)}`);
      return;
    }
    if (e.t !== 'cmd' || e.exit === 127) return;
    const args = e.argv.slice(1).join(' ');
    this.pushCapped(seen.cmds, `${e.name} ${args}`);
    const stats = this.stats();
    stats.commands++;
    stats.cmd[e.name] = (stats.cmd[e.name] ?? 0) + 1;
    if (e.exit !== 0) stats.failed++;
    if (e.stages.length > 1) {
      this.pushCapped(seen.pipes, e.stages.join('|'));
      if (e.stages.length > stats.maxStages) stats.maxStages = e.stages.length;
      if (e.stages.length >= 4) this.award('pipeline');
    }
    if (e.name === 'base64' && /(^| )(-d|--decode)/.test(args)) this.signal('cmd:base64-d');
    if (!this.state.seenCommands.includes(e.name)) {
      this.state.seenCommands.push(e.name);
      const cmd = this.shell.commands.get(e.name);
      if (cmd?.man.why) this.state.fieldNotes.unshift({ command: e.name, at: this.now() } satisfies FieldNote);
    }
  }

  private stats(): Stats {
    return (this.state.stats ??= { commands: 0, cmd: {}, maxStages: 0, failed: 0, sqlQueries: 0, reportsFiled: 0, hintsUsed: 0 });
  }
  get statistics() {
    return this.stats();
  }

  private onNetEvent(e: NetEvent): void {
    const seen = this.state.seen;
    if (e.t === 'dns') {
      this.pushCapped(seen.dns, `${e.name}|${e.type}`);
      this.discoverName(e.name);
    } else if (e.t === 'probe') {
      this.pushCapped(seen.probes, `${e.kind}|${e.target}`);
      this.discoverName(e.target);
      if (e.kind === 'nmap' && e.target.includes('/')) {
        for (const h of HOSTS) if (h.ip.startsWith('10.40.0.')) this.pushCapped(this.state.discoveredHosts, h.name);
      }
    } else {
      this.pushCapped(seen.http, `${e.host}|${e.path}|${e.status}|${e.method}|${e.via}`);
      this.discoverName(e.host);
      this.state.httpLog.push({ host: e.host, path: e.path, status: e.status, at: this.now() });
      if (this.state.httpLog.length > 60) this.state.httpLog.shift();
    }
  }

  private discoverName(name: string): void {
    const host = this.net.hostFor(name);
    if (host) this.pushCapped(this.state.discoveredHosts, host.name);
  }

  private onSql(db: string, sql: string, r: QuerySet): void {
    this.stats().sqlQueries++;
    if (r.error && /readonly/i.test(r.error)) this.signal('sql-readonly-refused');
    const text = r.sets.map((s) => s.rows.map((row) => row.join('|')).join('\n')).join('\n');
    // Remember every SQL check satisfied by this query now, so results need not be stored.
    const visit = (c: Check) => {
      if (c.kind === 'all' || c.kind === 'any') c.of.forEach(visit);
      else if (c.kind === 'sql' && c.db === db && !r.error) {
        const matchOk = !c.match || new RegExp(c.match, 'i').test(sql);
        const resultOk = !c.result || text.includes(c.result);
        const rowsOk = !c.minRows || r.sets.reduce((n, s) => n + s.rows.length, 0) >= c.minRows;
        if (matchOk && resultOk && rowsOk) this.state.signals[this.sqlKey(c)] = 1;
      }
    };
    for (const m of MISSIONS) {
      if (this.state.missions[m.id]?.status !== 'active') continue;
      m.objectives.forEach((o) => visit(o.check));
      m.optionals.forEach((o) => visit(o.check));
    }
    for (const n of SKILL_NODES) {
      const ch = n.check;
      if ('sql' in ch && new RegExp(ch.sql, 'i').test(sql) && !r.error) this.state.signals[`skillsql:${n.id}`] = 1;
    }
    this.evaluate();
  }

  private sqlKey(c: Extract<Check, { kind: 'sql' }>): string {
    return `sql:${c.db}:${c.match ?? ''}:${c.result ?? ''}`;
  }

  signal(id: string): void {
    this.state.signals[id] = (this.state.signals[id] ?? 0) + 1;
  }

  // ---------- checks ----------

  private checkPasses(c: Check, m: Mission, p: MissionProgress): boolean {
    const seen = this.state.seen;
    switch (c.kind) {
      case 'all':
        return c.of.every((x) => this.checkPasses(x, m, p));
      case 'any':
        return c.of.some((x) => this.checkPasses(x, m, p));
      case 'cmd': {
        const re = c.args ? new RegExp(c.args, 'i') : null;
        return seen.cmds.some((s) => {
          const i = s.indexOf(' ');
          const name = i < 0 ? s : s.slice(0, i);
          if (name !== c.name) return false;
          return !re || re.test(s.slice(i + 1));
        });
      }
      case 'pipeline':
        return seen.pipes.some((p2) => {
          const stages = p2.split('|');
          let i = 0;
          for (const st of stages) if (st === c.stages[i]) i++;
          return i === c.stages.length;
        });
      case 'read':
        return seen.reads.includes(`${c.host ?? 'workbench'}:${normalize(c.path)}`);
      case 'http':
        return seen.http.some((s) => {
          const [host, path, status, method, via] = s.split('|');
          return host === c.host && (!c.path || path === c.path) && (!c.status || Number(status) === c.status) && (!c.method || method === c.method) && (!c.via || via === c.via);
        });
      case 'dns':
        return seen.dns.some((s) => {
          const [name, type] = s.split('|');
          return (!c.name || name === c.name) && (!c.type || type === c.type);
        });
      case 'probe':
        return seen.probes.some((s) => {
          const [kind, target] = s.split('|');
          return kind === c.probe && (!c.target || target === c.target);
        });
      case 'sql':
        return !!this.state.signals[this.sqlKey(c)];
      case 'signal':
        return !!this.state.signals[c.id];
      case 'answer':
        return p.answers[c.key] !== undefined;
      case 'file': {
        const fs = this.fileSystem(c.host ?? 'workbench');
        const n = fs.lookup(c.path);
        if (!n || n.k !== 'f') return false;
        if (c.contains && !fs.fileContent(n).includes(c.contains)) return false;
        if (c.mode !== undefined && (n.mode & 0o777) !== c.mode) return false;
        if (c.tag && n.tag !== c.tag) return false;
        return true;
      }
      case 'evidence':
        return this.state.evidence.some((e) => e.id === c.id);
      case 'report':
        return !!p.reportDone;
      case 'cwd':
        return this.shell.cwd === normalize(c.path);
      case 'sealed':
        return this.state.sealed;
    }
  }

  /** Re-evaluates objectives, optionals, skills and narrative. Idempotent. */
  evaluate(): void {
    // A rule can change what other checks see, so a nested call asks for another pass.
    if (this.busyEval) {
      this.evalAgain = true;
      return;
    }
    this.busyEval = true;
    try {
      let passes = 0;
      do {
        this.evalAgain = false;
        this.evaluatePass();
      } while (this.evalAgain && ++passes < 6);
    } finally {
      this.busyEval = false;
    }
  }

  private evaluatePass(): void {
    {
      for (const m of MISSIONS) {
        const p = this.state.missions[m.id];
        if (!p || p.status !== 'active') continue;
        for (const o of m.objectives) {
          if (p.objectives.includes(o.id)) continue;
          if (this.checkPasses(o.check, m, p)) {
            p.objectives.push(o.id);
            const hintPenalty = Math.min(p.hints[o.id] ?? 0, 3) * 0.1;
            this.addXp(Math.round(o.xp * (1 - hintPenalty)));
            this.toast({ kind: 'objective', title: 'Objective complete', body: o.text });
            if (o.effects) this.apply(o.effects);
          }
        }
        for (const o of m.optionals) {
          if (p.optionals.includes(o.id)) continue;
          if (this.checkPasses(o.check, m, p)) {
            p.optionals.push(o.id);
            this.addXp(o.xp);
            this.toast({ kind: 'evidence', title: `Discovery: ${o.title}`, body: o.text });
            if (o.effects) this.apply(o.effects);
          }
        }
        if (m.objectives.every((o) => p.objectives.includes(o.id))) this.completeMission(m, p);
      }
      this.evaluateSkills();
      for (const rule of WORLD_RULES) {
        if (!this.state.firedBeats.includes(rule.id) && this.cond(rule.when)) {
          this.state.firedBeats.push(rule.id);
          this.apply(rule.effects);
        }
      }
      this.pump();
    }
  }

  private evaluateSkills(): void {
    for (const n of SKILL_NODES) {
      if (this.state.skills.includes(n.id)) continue;
      if (!n.requires.every((r) => this.state.skills.includes(r))) continue;
      if (this.skillPasses(n.id, n.check)) {
        this.state.skills.push(n.id);
        this.addXp(10);
        this.toast({ kind: 'skill', title: `Skill: ${n.title}`, body: n.text });
      }
    }
  }

  private skillPasses(id: string, c: SkillCheck): boolean {
    const st = this.stats();
    if ('cmd' in c) {
      if ((st.cmd[c.cmd] ?? 0) < (c.times ?? 1)) return false;
      if (!c.args) return true;
      const re = new RegExp(c.args);
      return this.state.seen.cmds.some((s) => s.startsWith(`${c.cmd} `) && re.test(s));
    }
    if ('stages' in c) return st.maxStages >= c.stages;
    if ('signal' in c) return !!this.state.signals[c.signal];
    if ('sql' in c) return !!this.state.signals[`skillsql:${id}`];
    if ('reportsFiled' in c) return st.reportsFiled >= c.reportsFiled;
    if ('objective' in c) {
      const [m, o] = c.objective.split('.');
      return !!this.state.missions[m]?.objectives.includes(o);
    }
    const [m, o] = c.optional.split('.');
    return !!this.state.missions[m]?.optionals.includes(o);
  }

  // ---------- conditions and effects ----------

  cond(c: Cond): boolean {
    if ('flag' in c) return !!this.state.flags[c.flag];
    if ('not' in c) return !this.cond(c.not);
    if ('all' in c) return c.all.every((x) => this.cond(x));
    if ('any' in c) return c.any.some((x) => this.cond(x));
    if ('missionDone' in c) return this.state.missions[c.missionDone]?.status === 'done';
    if ('missionActive' in c) return this.state.missions[c.missionActive]?.status === 'active';
    if ('rel' in c) return this.state.relationships[c.rel[0]] >= c.rel[1];
    if ('evidence' in c) return this.state.evidence.some((e) => e.id === c.evidence);
    if ('beat' in c) return this.state.firedBeats.includes(c.beat);
    if ('objectiveDone' in c) return !!this.state.missions[c.objectiveDone[0]]?.objectives.includes(c.objectiveDone[1]);
    if ('optionalDone' in c) return !!this.state.missions[c.optionalDone[0]]?.optionals.includes(c.optionalDone[1]);
    return !!this.state.signals[c.signal];
  }

  apply(effects: Effect[]): void {
    for (const e of effects) {
      if ('flag' in e) this.state.flags[e.flag] = true;
      else if ('unflag' in e) delete this.state.flags[e.unflag];
      else if ('rel' in e) this.state.relationships[e.rel[0]] += e.rel[1];
      else if ('standing' in e) this.state.standing = Math.max(0, this.state.standing + e.standing);
      else if ('credits' in e) this.state.credits += e.credits;
      else if ('offer' in e) this.offerMission(e.offer);
      else if ('accept' in e) this.acceptMission(e.accept);
      else if ('evidence' in e) this.addEvidence(e.evidence, null);
      else if ('tool' in e) this.unlockTool(e.tool);
      else if ('journal' in e) this.addJournal(e.journal, e.kind ?? 'story');
      else if ('ending' in e) this.setEnding(e.ending);
      else if ('achievement' in e) this.award(e.achievement);
      else if ('fileTo' in e) installFile(this.fileSystem(e.fileTo.host), e.fileTo.file);
    }
  }

  private setEnding(id: GameState['ending']): void {
    if (this.state.ending) return;
    this.state.ending = id;
    this.signal('ending-chosen');
    if (id === 'ghost' && this.state.sealed) this.state.flags.sealed_kept = true;
    this.award('all_endings_one');
    this.addJournal(`The Gramtele file closes here.`, 'decision');
    this.evaluate();
  }

  private unlockTool(t: string): void {
    if (this.state.tools.includes(t)) return;
    this.state.tools.push(t);
    this.toast({ kind: 'system', title: 'Tools installed', body: `Toolkit: ${t}. "help" lists what is new.` });
  }

  addJournal(text: string, kind: JournalKind = 'note'): void {
    this.state.journal.unshift({ at: this.now(), kind, text });
  }

  addNote(text: string): void {
    this.addJournal(text, 'note');
    this.changed();
  }

  award(id: string): void {
    if (this.state.achievements.includes(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    this.state.achievements.push(id);
    this.addXp(15);
    this.toast({ kind: 'achievement', title: a.title, body: a.text });
  }

  private addXp(n: number): void {
    const before = levelFor(this.state.xp);
    this.state.xp += n;
    const after = levelFor(this.state.xp);
    if (after > before) this.toast({ kind: 'level', title: `Level ${after}` });
  }

  toast(t: Omit<Toast, 'id'>): void {
    this.toasts.push({ ...t, id: this.toastId++ });
    if (this.toasts.length > 5) this.toasts.shift();
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.changed();
  }

  // ---------- missions ----------

  private blankProgress(status: MissionProgress['status']): MissionProgress {
    return { status, objectives: [], optionals: [], answers: {}, wrong: [], hints: {}, commands: 0 };
  }

  private offerMission(id: string): void {
    if (!this.state.missions[id]) this.state.missions[id] = this.blankProgress('offered');
  }

  acceptMission(id: string): void {
    const m = MISSION_BY_ID[id];
    if (!m) return;
    const p = (this.state.missions[id] ??= this.blankProgress('offered'));
    if (p.status === 'active' || p.status === 'done') return;
    p.status = 'active';
    p.acceptedAt = this.now();
    this.state.activeMission = id;
    const clock = Date.parse(`${m.clock}Z`);
    if (clock > this.now()) {
      this.state.clockBase = clock;
      this.state.playMs = 0;
    }
    for (const t of m.tools) this.unlockTool(t);
    for (const f of m.files ?? []) installFile(this.fileSystem(f.host), { ...f.file, mtime: f.file.mtime ?? this.now() });
    this.toast({ kind: 'mission', title: `Mission accepted: ${m.title}`, body: `Chapter ${m.chapter}. ${m.chapterTitle}.` });
    this.addJournal(`Accepted "${m.title}" from ${m.contact}.`, 'story');
    this.evaluate();
    this.changed();
  }

  private completeMission(m: Mission, p: MissionProgress): void {
    p.status = 'done';
    p.finishedAt = this.now();
    if (this.state.activeMission === m.id) this.state.activeMission = null;
    this.addXp(m.rewards.xp);
    this.state.credits += m.rewards.credits;
    this.state.standing += m.rewards.standing;
    if (!Object.keys(p.hints).length) this.award('no_hints');
    if (p.optionals.length === m.optionals.length) this.award('explorer');
    this.toast({ kind: 'mission', title: `Mission complete: ${m.title}`, body: `+${m.rewards.xp} XP, +${m.rewards.credits} credits` });
    this.addJournal(`Completed "${m.title}".`, 'story');
    if (m.onComplete) this.apply(m.onComplete);
  }

  activeProgress(): MissionProgress | null {
    return this.state.activeMission ? this.state.missions[this.state.activeMission] : null;
  }

  activeMissionDef(): Mission | null {
    return this.state.activeMission ? MISSION_BY_ID[this.state.activeMission] : null;
  }

  private answersFor(o: Objective): AnswerDef[] {
    return [...(o.answer ? [o.answer] : []), ...(o.extraAnswers ?? [])];
  }

  openAnswers(): { key: string; prompt: string }[] {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return [];
    return m.objectives.flatMap((o) => this.answersFor(o)).filter((a) => p.answers[a.key] === undefined).map((a) => ({ key: a.key, prompt: a.prompt }));
  }

  submit(key: string, value: string): { known: boolean; ok: boolean; message: string } {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return { known: false, ok: false, message: 'No active assignment.' };
    const def = m.objectives.flatMap((o) => this.answersFor(o)).find((a) => a.key === key);
    if (!def) return { known: false, ok: false, message: `This assignment has no finding called "${key}". Run "submit" to see what is outstanding.` };
    if (p.answers[key] !== undefined) return { known: true, ok: true, message: `Already filed: ${key} = ${p.answers[key]}` };
    const v = normAnswer(value);
    if (def.accept.some((x) => normAnswer(x) === v)) {
      p.answers[key] = value;
      this.evaluate();
      this.changed();
      return { known: true, ok: true, message: `Filed. ${def.right ?? ''}`.trim() };
    }
    p.wrong.push({ key, value });
    this.changed();
    return { known: true, ok: false, message: `Not accepted. ${def.wrong ?? 'Check your evidence and try again.'}` };
  }

  missionStatus(): string[] {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return ['No active assignment. Check Gramtele.'];
    const lines = [`${m.id}: ${m.title}  (Chapter ${m.chapter}, contact ${m.contact})`, ''];
    m.objectives.forEach((o, i) => lines.push(`  ${p.objectives.includes(o.id) ? '[x]' : '[ ]'} ${i + 1}. ${o.text}`));
    return lines;
  }

  hint(index?: number): string {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return 'No active assignment.';
    const o = index !== undefined ? m.objectives[index] : m.objectives.find((x) => !p.objectives.includes(x.id));
    if (!o) return 'No such objective.';
    if (p.objectives.includes(o.id)) return 'That objective is already complete.';
    return this.revealHint(m.id, o.id) ?? '';
  }

  /** Reveals the next hint level for an objective and returns it. */
  revealHint(missionId: string, objectiveId: string): string | null {
    const m = MISSION_BY_ID[missionId];
    const p = this.state.missions[missionId];
    const o = m?.objectives.find((x) => x.id === objectiveId);
    if (!m || !p || !o) return null;
    const level = Math.min(p.hints[o.id] ?? 0, 2);
    p.hints[o.id] = level + 1;
    this.stats().hintsUsed++;
    this.changed();
    return `Hint ${level + 1}/3: ${o.hints[level]}`;
  }

  fileReport(missionId: string, responses: ReportResponses): ReportResult {
    const m = MISSION_BY_ID[missionId];
    const p = this.state.missions[missionId];
    const def = m?.report as ReportDef | undefined;
    if (!m || !p || !def || p.status !== 'active') return { passed: false, score: 0, feedback: [] };
    const feedback: ReportResult['feedback'] = [];
    let graded = 0;
    let right = 0;
    const wrongIds: string[] = [];
    for (const s of def.sections) {
      const r = responses[s.id];
      if (s.kind === 'decision') continue;
      graded++;
      if (s.kind === 'choice') {
        const opt = s.options.find((o) => o.id === r);
        const ok = !!opt?.correct;
        if (ok) right++;
        else wrongIds.push(s.id);
        feedback.push({ section: s.title, correct: ok, text: opt?.why ?? 'No answer selected.' });
      } else {
        const ok = Array.isArray(r) && r.join() === s.correct.join();
        if (ok) right++;
        else wrongIds.push(s.id);
        feedback.push({ section: s.title, correct: ok, text: ok ? 'The order holds up against your sources.' : 'The order does not match the dates in your sources. Check each one again.' });
      }
    }
    const score = graded ? right / graded : 1;
    const passed = score >= def.passMark;
    p.reportWrong = [...new Set([...(p.reportWrong ?? []), ...wrongIds])];
    if (!passed) {
      this.changed();
      return { passed, score, feedback };
    }
    for (const s of def.sections) {
      if (s.kind !== 'decision') continue;
      const opt = s.options.find((o) => o.id === responses[s.id]);
      if (!opt) return { passed: false, score, feedback: [...feedback, { section: s.title, correct: false, text: 'This decision is still open.' }] };
      if (opt.effects) this.apply(opt.effects);
      this.addJournal(opt.decision, 'decision');
    }
    p.reportDone = true;
    p.reportScore = score;
    this.stats().reportsFiled++;
    if (score === 1 && !p.reportWrong.length) this.award('flawless');
    this.evaluate();
    this.changed();
    return { passed, score, feedback };
  }

  // ---------- evidence ----------

  private addEvidence(id: string, hash: string | null, path?: string): boolean {
    if (this.state.evidence.some((e) => e.id === id)) return false;
    const def = EVIDENCE[id];
    this.state.evidence.push({ id, title: def?.title ?? path?.split('/').pop() ?? id, summary: def?.summary ?? 'Collected by you. Not linked to the case file.', source: def?.source ?? 'Workbench', hash, at: this.now(), path });
    return true;
  }

  collectEvidence(tag: string | undefined, path: string, hash: string): { added: boolean; title: string } {
    const id = tag && EVIDENCE[tag] ? tag : `misc-${hash.slice(0, 10)}`;
    const added = this.addEvidence(id, hash, path);
    const rec = this.state.evidence.find((e) => e.id === id)!;
    if (added) this.toast({ kind: 'evidence', title: 'Evidence collected', body: rec.title });
    this.evaluate();
    this.changed();
    return { added, title: added ? rec.title : `Already in locker: ${rec.title}` };
  }

  evidenceRows() {
    return this.state.evidence.map((e) => ({ id: e.id, title: e.title, hash: e.hash, source: e.source }));
  }

  dossierRequired() {
    return Object.values(EVIDENCE).filter((e) => e.exhibit).map((e) => ({ tag: e.id, title: e.title }));
  }

  markSealed(tags: string[]): void {
    this.state.sealed = true;
    this.signal('dossier-sealed');
    for (const t of tags) this.addEvidence(t, null);
    this.addJournal('Sealed the dossier. Five exhibits, all verified.', 'finding');
    this.evaluate();
    this.changed();
  }

  // ---------- narrative ----------

  private thread(id: ThreadId) {
    return (this.state.threads[id] ??= { messages: [], unread: 0, archived: CHARACTERS[id].kind === 'archive', visible: true });
  }

  private pump(): void {
    for (const b of BEATS) {
      if (this.state.firedBeats.includes(b.id)) continue;
      if (!this.cond(b.when)) continue;
      const blocked = this.state.pendingMessages.some((m) => m.thread === b.thread) || this.state.pendingChoices.some((c) => c.thread === b.thread);
      if (blocked) continue;
      this.fire(b);
    }
  }

  private typingDelay(msg: Msg): number {
    if (this.state.settings.typingSpeed === 'instant') return 150;
    return msg.delay ?? Math.min(700 + msg.text.length * 18, 3600);
  }

  private fire(b: Beat): void {
    this.state.firedBeats.push(b.id);
    const start = this.realNow() + (this.state.settings.typingSpeed === 'instant' ? 200 : (b.delay ?? 0));
    this.queue(b.thread, b.messages, start);
    if (b.effects) this.apply(b.effects);
    if (b.choices) this.state.pendingChoices.push({ beatId: b.id, thread: b.thread, contactRequest: b.contactRequest });
  }

  private queue(thread: ThreadId, msgs: Msg[], start: number): void {
    let t = start;
    for (const m of msgs) {
      if (m.if && !this.cond(m.if)) continue;
      t += this.typingDelay(m);
      this.state.pendingMessages.push({ thread, msg: m, dueAt: t });
    }
  }

  /** Called on a timer by the UI, and directly in tests. */
  tick(): void {
    const t = this.realNow();
    const dt = Math.min(t - this.lastTick, 5000);
    this.lastTick = t;
    if (this.state.flags.signed_up && !this.state.ending) this.state.playMs += Math.max(0, dt);
    const due = this.state.pendingMessages.filter((m) => m.dueAt <= t);
    if (due.length) {
      this.state.pendingMessages = this.state.pendingMessages.filter((m) => m.dueAt > t);
      for (const d of due) this.deliver(d.thread, d.msg);
      this.pump();
      this.changed();
    } else {
      this.pump();
    }
  }

  private deliver(threadId: ThreadId, msg: Msg): void {
    const th = this.thread(threadId);
    const from = msg.from ?? threadId;
    const cm: ChatMessage = { id: this.state.nextMsgId++, from, text: msg.text, at: this.now(), attachment: msg.attachment, invite: msg.invite };
    th.messages.push(cm);
    th.unread++;
    th.visible = true;
    if (from !== 'sys') this.toast({ kind: 'message', title: CHARACTERS[threadId].handle, body: msg.text.length > 90 ? `${msg.text.slice(0, 90)}...` : msg.text, thread: threadId });
  }

  markRead(id: ThreadId): void {
    const th = this.state.threads[id];
    if (th && th.unread) {
      th.unread = 0;
      this.changed();
    }
  }

  setArchived(id: ThreadId, archived: boolean): void {
    this.thread(id).archived = archived;
    this.changed();
  }

  /** Choices the player can make now in this thread. Empty while the other side is still typing. */
  choicesFor(id: ThreadId): { beat: Beat; choices: Choice[]; contactRequest: boolean } | null {
    if (this.state.pendingMessages.some((m) => m.thread === id)) return null;
    const pending = this.state.pendingChoices.find((c) => c.thread === id);
    if (!pending) return null;
    const beat = BEATS.find((b) => b.id === pending.beatId);
    if (!beat) return null;
    const choices = (beat.choices ?? []).filter((c) => (!c.if || this.cond(c.if)) && !this.state.flags[`used:${beat.id}:${c.id}`]);
    return { beat, choices, contactRequest: !!pending.contactRequest };
  }

  isTyping(id: ThreadId): boolean {
    return this.state.pendingMessages.some((m) => m.thread === id && m.dueAt - this.realNow() < 3600);
  }

  choose(id: ThreadId, choiceId: string): void {
    const av = this.choicesFor(id);
    const choice = av?.choices.find((c) => c.id === choiceId);
    if (!av || !choice) return;
    const th = this.thread(id);
    th.messages.push({ id: this.state.nextMsgId++, from: 'me', text: choice.reply ?? choice.label, at: this.now() });
    if (choice.keep) this.state.flags[`used:${av.beat.id}:${choice.id}`] = true;
    else this.state.pendingChoices = this.state.pendingChoices.filter((c) => c.beatId !== av.beat.id);
    if (choice.decision) this.addJournal(choice.decision, 'decision');
    if (choice.then) this.queue(id, choice.then, this.realNow());
    if (choice.effects) this.apply(choice.effects);
    this.evaluate();
    this.changed();
  }

  /** Saves a page or file from the in-game browser. Goes through the same evidence tagging as curl -o. */
  saveDownload(name: string, data: string, tag?: string): string {
    const clean = name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'download';
    const path = `/home/player/Downloads/${clean}`;
    installFile(this.fileSystem('workbench'), { path, data, tag, uid: 1000, mtime: this.now() });
    this.evaluate();
    this.changed();
    return path;
  }

  /** Saves an attachment to the workbench, like a download. */
  takeAttachment(id: ThreadId, messageId: number): string | null {
    const msg = this.state.threads[id]?.messages.find((m) => m.id === messageId);
    if (!msg?.attachment?.file) return null;
    const f: SeedFile = msg.attachment.file;
    installFile(this.fileSystem('workbench'), { ...f, mtime: this.now(), gid: f.uid });
    msg.taken = true;
    this.changed();
    return f.path;
  }

  // ---------- settings ----------

  updateSettings(fn: (s: Settings) => void): void {
    fn(this.state.settings);
    this.changed();
  }

  relationship(c: CharacterId): number {
    return this.state.relationships[c];
  }

  /** Whether the file system root is present. Used by save validation. */
  rootIdentity() {
    return ROOT;
  }
}
