/**
 * GameEngine ties the systems together: shell, virtual network, databases, missions,
 * narrative and progression. It has no React in it and can be played headlessly.
 */
import { CHARACTERS } from '../data/characters';
import { CHAT_REACTIONS, smalltalkFor } from '../data/dialogue/smalltalk';
import { isLine, lineIn, setLineVars, tr, ui, T, keyOfEnglish } from '../i18n';
import { CLEAN_BONUS, rankOf, standingOf, TABLE, tierOf } from '../data/reputation';
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
  AnswerDef, Attachment, Beat, ChatMessage, CharacterId, Check, Choice, Cond, Effect, FieldNote, GameState, JournalKind, Mission, MissionProgress, Msg,
  Objective, ReportDef, Settings, SkillCheck, Stats, ThreadId, Toast,
} from './types';
import { NetEvent, VirtualNet } from './virtual-network/net';

export const SAVE_VERSION = 3;
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

const wordsOf = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);

/** Finds the suggested reply the player meant: its number, its words, or most of its words. In either language. */
export function matchChoice(text: string, choices: Choice[]): Choice | null {
  const digit = /^[1-9]$/.test(text.trim()) ? Number(text.trim()) - 1 : -1;
  if (digit >= 0 && choices[digit]) return choices[digit];
  const said = wordsOf(text);
  if (!said.length) return null;
  let best: Choice | null = null;
  let bestScore = 0;
  for (const c of choices) {
    for (const source of [c.label, c.reply ?? c.label].flatMap(sourcesOf)) {
      const words = wordsOf(source);
      if (!words.length) continue;
      const hits = said.filter((w) => words.includes(w)).length;
      const score = hits / Math.max(said.length, words.length);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }
  return bestScore >= 0.72 ? best : null;
}

/** What a suggested reply says, in every language it exists in. */
function sourcesOf(text: string): string[] {
  if (!isLine(text)) return [text, tr(text)];
  return (['en', 'fr'] as const).flatMap((l) => lineIn(l, text) ?? []);
}

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
      gramtele_meta: () => gramteleMetaSeed(this.state.handle || 'c-0047', this.state.standing),
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
    setLineVars({ handle: state.handle || 'c-0047' });
    if (state.version < SAVE_VERSION) this.migrate();
  }

  private migrate(): void {
    if (this.state.version < 2) this.migrateScene();
    if (this.state.version < 3) this.migrateText();
    this.state.version = SAVE_VERSION;
  }

  /** Saves from before missions and the interface had their own datasets stored English sentences. They become keys, so they still follow the language. */
  private migrateText(): void {
    const upgrade = (text: string) => keyOfEnglish(text) ?? text;
    for (const e of this.state.journal) {
      if (e.kind === 'note') continue; // The player's own words.
      e.text = upgrade(e.text);
      if (e.vars) e.vars = Object.fromEntries(Object.entries(e.vars).map(([k, v]) => [k, upgrade(v)]));
    }
    for (const e of this.state.evidence) {
      e.title = upgrade(e.title);
      e.summary = upgrade(e.summary);
      e.source = upgrade(e.source);
    }
    for (const m of MISSIONS) {
      for (const f of m.files ?? []) {
        const fs = this.fileSystem(f.host);
        if (!fs.exists(f.file.path)) continue; // Not offered yet: it will arrive with its key.
        const node = fs.stat(f.file.path);
        if (node.k === 'f' && node.data !== undefined) node.data = upgrade(node.data);
      }
    }
  }

  /** Saves from before the scene had a memory: credit finished work, and do not replay chatter they missed. */
  private migrateScene(): void {
    let earned = 0;
    for (const m of MISSIONS) {
      const p = this.state.missions[m.id];
      if (p?.status !== 'done') continue;
      earned += m.rewards.standing + this.markPerformance(m, p);
    }
    this.state.standing = Math.max(this.state.standing, earned);
    for (const t of TABLE) if (this.state.standing > standingOf(t.handle, this.state.flags)) this.state.flags[`passed:${t.handle}`] = true;
    for (const b of BEATS) if (b.social && !this.state.firedBeats.includes(b.id) && this.cond(b.when)) this.state.firedBeats.push(b.id);
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
        localize: (text) => (text ? tr(text) : text),
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
    setLineVars({ handle });
    this.state.flags.signed_up = true;
    this.state.threads.NULL ??= { messages: [], unread: 0, archived: false, visible: true, pinned: true };
    this.addJournal(ui('created_a_gramtele_account_nothing'), 'story');
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
        if (c.contains && !fs.rawContent(n).includes(c.contains) && !fs.fileContent(n).includes(c.contains)) return false;
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
            this.toast({ kind: 'objective', title: T('objective_complete'), body: tr(o.text) });
            if (o.effects) this.apply(o.effects);
          }
        }
        for (const o of m.optionals) {
          if (p.optionals.includes(o.id)) continue;
          if (this.checkPasses(o.check, m, p)) {
            p.optionals.push(o.id);
            this.addXp(o.xp);
            this.toast({ kind: 'evidence', title: T('discovery_title', { title: tr(o.title) }), body: tr(o.text) });
            if (o.effects) this.apply(o.effects);
          }
        }
        if (m.objectives.every((o) => p.objectives.includes(o.id))) this.completeMission(m, p);
      }
      this.evaluateSkills();
      this.evaluateTable();
      for (const rule of WORLD_RULES) {
        if (!this.state.firedBeats.includes(rule.id) && this.cond(rule.when)) {
          this.state.firedBeats.push(rule.id);
          this.apply(rule.effects);
        }
      }
      this.pump();
    }
  }

  /** Passing someone on the table is public, and it is remembered. */
  private evaluateTable(): void {
    for (const t of TABLE) {
      const flag = `passed:${t.handle}`;
      if (this.state.flags[flag] || this.state.standing <= standingOf(t.handle, this.state.flags)) continue;
      this.state.flags[flag] = true;
      this.toast({ kind: 'system', title: T('you_passed_name_on_the', { name: t.handle }), body: T('standing_n_rank_rank', { n: this.state.standing, rank: tr(rankOf(this.state.standing).title) }) });
    }
  }

  private evaluateSkills(): void {
    for (const n of SKILL_NODES) {
      if (this.state.skills.includes(n.id)) continue;
      if (!n.requires.every((r) => this.state.skills.includes(r))) continue;
      if (this.skillPasses(n.id, n.check)) {
        this.state.skills.push(n.id);
        this.addXp(10);
        this.toast({ kind: 'skill', title: T('skill_title', { title: tr(n.title) }), body: tr(n.text) });
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
    if ('standing' in c) return this.state.standing >= c.standing;
    if ('read' in c) return this.state.seen.reads.includes(`workbench:${normalize(c.read)}`);
    if ('stat' in c) return this.stats()[c.stat[0]] >= c.stat[1];
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
    this.addJournal(ui('the_gramtele_file_closes_here'), 'decision');
    this.evaluate();
  }

  private unlockTool(t: string): void {
    if (this.state.tools.includes(t)) return;
    this.state.tools.push(t);
    this.toast({ kind: 'system', title: T('tools_installed'), body: T('toolkit_name_help_lists_what', { name: t }) });
  }

  addJournal(text: string, kind: JournalKind = 'note', vars?: Record<string, string>): void {
    this.state.journal.unshift({ at: this.now(), kind, text, ...(vars ? { vars } : {}) });
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
    this.toast({ kind: 'achievement', title: tr(a.title), body: tr(a.text) });
  }

  private addXp(n: number): void {
    const before = levelFor(this.state.xp);
    this.state.xp += n;
    const after = levelFor(this.state.xp);
    if (after > before) this.toast({ kind: 'level', title: T('level_n', { n: after }) });
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
    this.toast({ kind: 'mission', title: T('mission_accepted_title', { title: tr(m.title) }), body: T('chapter_n_sentence', { n: m.chapter, title: tr(m.chapterTitle) }) });
    this.addJournal(ui('accepted_title_from_contact'), 'story', { title: m.title, contact: m.contact });
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
    const bonus = this.markPerformance(m, p);
    this.state.standing += bonus;
    if (bonus) this.toast({ kind: 'system', title: T('standing_n', { n: bonus }), body: T('people_read_how_a_job') });
    if (!Object.keys(p.hints).length) this.award('no_hints');
    if (p.optionals.length === m.optionals.length) this.award('explorer');
    this.toast({ kind: 'mission', title: T('mission_complete_title', { title: tr(m.title) }), body: T('xp_xp_credits_credits', { xp: m.rewards.xp, credits: m.rewards.credits }) });
    this.addJournal(ui('completed_title'), 'story', { title: m.title });
    if (m.onComplete) this.apply(m.onComplete);
  }

  /** Records how a finished job was done, for people to talk about. Returns the standing it is worth. */
  private markPerformance(m: Mission, p: MissionProgress): number {
    const f = this.state.flags;
    f[Object.keys(p.hints).length ? `hinted:${m.id}` : `clean:${m.id}`] = true;
    if (m.optionals.length && p.optionals.length === m.optionals.length) f[`thorough:${m.id}`] = true;
    if (p.reportDone && p.reportScore === 1 && !p.reportWrong?.length) f[`flawless:${m.id}`] = true;
    return [`clean:${m.id}`, `thorough:${m.id}`, `flawless:${m.id}`].filter((k) => f[k]).length * CLEAN_BONUS;
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
    return m.objectives.flatMap((o) => this.answersFor(o)).filter((a) => p.answers[a.key] === undefined).map((a) => ({ key: a.key, prompt: tr(a.prompt) }));
  }

  submit(key: string, value: string): { known: boolean; ok: boolean; message: string } {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return { known: false, ok: false, message: T('no_active_assignment_2') };
    const def = m.objectives.flatMap((o) => this.answersFor(o)).find((a) => a.key === key);
    if (!def) return { known: false, ok: false, message: T('this_assignment_has_no_finding', { key }) };
    if (p.answers[key] !== undefined) return { known: true, ok: true, message: T('already_filed_key_value', { key, value: p.answers[key] }) };
    const v = normAnswer(value);
    if (def.accept.some((x) => normAnswer(x) === v)) {
      p.answers[key] = value;
      this.evaluate();
      this.changed();
      return { known: true, ok: true, message: `${T('filed')} ${def.right ? tr(def.right) : ''}`.trim() };
    }
    p.wrong.push({ key, value });
    this.changed();
    return { known: true, ok: false, message: `${T('not_accepted')} ${tr(def.wrong ?? ui('check_your_evidence_and_try'))}` };
  }

  missionStatus(): string[] {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return [T('no_active_assignment_check_gramtele')];
    const lines = [T('id_title_chapter_n_contact', { id: m.id, title: tr(m.title), n: m.chapter, contact: m.contact }), ''];
    m.objectives.forEach((o, i) => lines.push(`  ${p.objectives.includes(o.id) ? '[x]' : '[ ]'} ${i + 1}. ${tr(o.text)}`));
    return lines;
  }

  hint(index?: number): string {
    const m = this.activeMissionDef();
    const p = this.activeProgress();
    if (!m || !p) return T('no_active_assignment_2');
    const o = index !== undefined ? m.objectives[index] : m.objectives.find((x) => !p.objectives.includes(x.id));
    if (!o) return T('no_such_objective');
    if (p.objectives.includes(o.id)) return T('that_objective_is_already_complete');
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
    return T('hint_n_3_text', { n: level + 1, text: tr(o.hints[level]) });
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
        feedback.push({ section: s.title, correct: ok, text: opt?.why ?? ui('no_answer_selected') });
      } else {
        const ok = Array.isArray(r) && r.join() === s.correct.join();
        if (ok) right++;
        else wrongIds.push(s.id);
        feedback.push({ section: s.title, correct: ok, text: ok ? ui('the_order_holds_up_against') : ui('the_order_does_not_match') });
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
      if (!opt) return { passed: false, score, feedback: [...feedback, { section: s.title, correct: false, text: ui('this_decision_is_still_open') }] };
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
    this.state.evidence.push({ id, title: def?.title ?? path?.split('/').pop() ?? id, summary: def?.summary ?? ui('collected_by_you_not_linked'), source: def?.source ?? ui('workbench'), hash, at: this.now(), path });
    return true;
  }

  collectEvidence(tag: string | undefined, path: string, hash: string): { added: boolean; title: string } {
    const id = tag && EVIDENCE[tag] ? tag : `misc-${hash.slice(0, 10)}`;
    const added = this.addEvidence(id, hash, path);
    const rec = this.state.evidence.find((e) => e.id === id)!;
    if (added) this.toast({ kind: 'evidence', title: T('evidence_collected'), body: tr(rec.title) });
    this.evaluate();
    this.changed();
    return { added, title: added ? tr(rec.title) : T('already_in_locker_title', { title: tr(rec.title) }) };
  }

  evidenceRows() {
    return this.state.evidence.map((e) => ({ id: e.id, title: tr(e.title), hash: e.hash, source: tr(e.source) }));
  }

  dossierRequired() {
    return Object.values(EVIDENCE).filter((e) => e.exhibit).map((e) => ({ tag: e.id, title: tr(e.title) }));
  }

  markSealed(tags: string[]): void {
    this.state.sealed = true;
    this.signal('dossier-sealed');
    for (const t of tags) this.addEvidence(t, null);
    this.addJournal(ui('sealed_the_dossier_five_exhibits'), 'finding');
    this.evaluate();
    this.changed();
  }

  // ---------- narrative ----------

  private thread(id: ThreadId) {
    return (this.state.threads[id] ??= { messages: [], unread: 0, archived: CHARACTERS[id].kind === 'archive', visible: true, pinned: id === 'NULL' });
  }

  private pump(): void {
    for (const b of BEATS) {
      if (this.state.firedBeats.includes(b.id)) continue;
      if (!this.cond(b.when)) continue;
      const blocked = this.state.pendingMessages.some((m) => m.thread === b.thread) || this.state.pendingChoices.some((c) => c.thread === b.thread && !BEATS.find((x) => x.id === c.beatId)?.expires);
      if (blocked) continue;
      this.state.pendingChoices = this.state.pendingChoices.filter((c) => c.thread !== b.thread);
      this.fire(b);
    }
  }

  private typingDelay(msg: Msg): number {
    if (this.state.settings.typingSpeed === 'instant') return 150;
    return msg.delay ?? Math.min(700 + tr(msg.text).length * 18, 3600);
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
    if (from !== 'sys' && !th.muted) {
      const shown = tr(msg.text);
      // A group can post several lines in a row: one notification is enough, showing the latest.
      if (CHARACTERS[threadId].kind === 'group') this.toasts = this.toasts.filter((t) => t.thread !== threadId);
      const title = CHARACTERS[threadId].kind === 'group' ? `${CHARACTERS[threadId].handle} · ${from}` : CHARACTERS[threadId].handle;
      this.toast({ kind: 'message', title, body: shown.length > 90 ? `${shown.slice(0, 90)}...` : shown, thread: threadId });
    }
    if (from !== 'sys') this.reactToPlayer(threadId, cm.id);
  }

  /** Now and then the other side acknowledges what you last said without writing anything. Never changes the story. */
  private reactToPlayer(id: ThreadId, seed: number): void {
    const pool = CHAT_REACTIONS[id];
    if (!pool || seed % 3 !== 0) return;
    const th = this.thread(id);
    const mine = [...th.messages].reverse().find((m) => m.from === 'me');
    if (!mine || mine.reactions?.some((r) => r.from !== 'me')) return;
    mine.reactions = [...(mine.reactions ?? []), { emoji: pool.emoji[seed % pool.emoji.length], from: pool.from }];
  }

  /** Where the unread separator goes when the player opens this conversation. */
  firstUnreadId(id: ThreadId): number | null {
    const th = this.state.threads[id];
    if (!th?.unread) return null;
    return th.messages.at(-th.unread)?.id ?? null;
  }

  // ---------- messaging ----------

  /**
   * Sends what the player typed. Text that matches a suggested reply counts as choosing it;
   * anything else is an ordinary message, answered in character, that leaves the story where it was.
   */
  sendMessage(id: ThreadId, raw: string): 'choice' | 'message' | 'refused' {
    const text = raw.trim();
    if (!text || !this.canWrite(id)) return 'refused';
    const av = this.choicesFor(id);
    const match = av ? matchChoice(text, av.choices) : null;
    if (match) {
      this.choose(id, match.id);
      return 'choice';
    }
    const th = this.thread(id);
    th.messages.push({ id: this.state.nextMsgId++, from: 'me', text, at: this.now() });
    this.answerOffScript(id);
    this.changed();
    return 'message';
  }

  /** Sends a file from the workbench. It is only a copy in a chat: uploads that matter go through curl. */
  sendFile(id: ThreadId, path: string): boolean {
    if (!this.canWrite(id)) return false;
    const fs = this.fileSystem('workbench');
    const node = fs.lookup(path);
    if (node?.k !== 'f') return false;
    const content = fs.fileContent(node);
    const printable = !/[\x00-\x08\x0e-\x1f]/.test(content.slice(0, 2000));
    const attachment: Attachment = {
      name: path.split('/').pop() ?? path,
      kind: /\.(jpe?g|png)$/i.test(path) ? 'photo' : printable ? 'text' : 'file',
      preview: printable ? content.slice(0, 900) : T('binary_file_n_bytes', { n: content.length }),
    };
    this.thread(id).messages.push({ id: this.state.nextMsgId++, from: 'me', text: '', at: this.now(), attachment });
    this.answerOffScript(id, true);
    this.changed();
    return true;
  }

  private answerOffScript(id: ThreadId, attachment = false): void {
    if (this.state.pendingMessages.some((m) => m.thread === id)) return;
    const th = this.thread(id);
    const n = th.smalltalk ?? 0;
    th.smalltalk = n + 1;
    const reply = smalltalkFor(id, n, attachment, tierOf(this.state.standing));
    if (reply) this.queue(id, [reply], this.realNow() + 500);
  }

  canWrite(id: ThreadId): boolean {
    return CHARACTERS[id]?.kind !== 'archive' && !!this.state.threads[id]?.visible;
  }

  /** Toggles one of the player's reactions on a message. */
  react(id: ThreadId, messageId: number, emoji: string): void {
    const msg = this.state.threads[id]?.messages.find((m) => m.id === messageId);
    if (!msg) return;
    const had = msg.reactions?.some((r) => r.from === 'me' && r.emoji === emoji);
    const others = (msg.reactions ?? []).filter((r) => r.from !== 'me');
    msg.reactions = had ? others : [...others, { emoji, from: 'me' }];
    this.changed();
  }

  togglePinned(id: ThreadId): void {
    const th = this.thread(id);
    th.pinned = !th.pinned;
    this.changed();
  }

  toggleMuted(id: ThreadId): void {
    const th = this.thread(id);
    th.muted = !th.muted;
    this.changed();
  }

  togglePinnedMessage(id: ThreadId, messageId: number): void {
    const th = this.thread(id);
    const list = th.pinnedMessages ?? [];
    th.pinnedMessages = list.includes(messageId) ? list.filter((x) => x !== messageId) : [...list, messageId].sort((a, b) => a - b);
    this.changed();
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
