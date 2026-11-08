/**
 * The shell: expands words, wires pipelines and redirections, tracks exit codes,
 * environment, cwd, history. Commands are functions over the VFS. Input is parsed
 * here and nowhere else; it is never passed to any host facility (no eval, no
 * real process, no real network).
 */
import { Identity, normalize, VFS, VfsError, dirname, basename, ROOT } from '../filesystem/vfs';
import { globToRegExp, ListItem, ParseError, parse, SimpleCommand, Word } from './parser';
import type { CmdCtx, Command, FullScreen, LineProgram, ShellHost } from './types';

export interface HostProfile {
  hostname: string;
  user: string;
  id: Identity;
  home: string;
  /** user id -> name table for ls -l, id, stat. */
  users: Record<number, string>;
  groups: Record<number, string>;
  /** Paths `sudo` allows, as glob-ish prefixes of the full command line. */
  sudoers?: string[];
}

export interface SessionFrame {
  profile: HostProfile;
  cwd: string;
  oldpwd: string;
  env: Record<string, string>;
}

export interface ExecOutput {
  /** Text destined for the terminal, stdout and stderr interleaved. */
  output: string;
  exit: number;
}

export class Shell {
  readonly commands: Map<string, Command>;
  host: ShellHost;
  stack: SessionFrame[] = [];
  history: string[] = [];
  lastExit = 0;
  fullscreen: FullScreen | null = null;
  program: LineProgram | null = null;
  /** Set by `clear`; the terminal view consumes it. */
  clearRequested = false;
  /** Scripts run from this many frames deep (guards recursion). */
  private depth = 0;
  /** True while a pipeline stage is run for `$(...)` etc. and must not log events. */
  private quiet = 0;

  constructor(host: ShellHost, commands: Command[], profile: HostProfile) {
    this.host = host;
    this.commands = new Map(commands.map((c) => [c.name, c]));
    this.stack.push(this.newFrame(profile));
  }

  newFrame(profile: HostProfile): SessionFrame {
    return {
      profile,
      cwd: profile.home,
      oldpwd: profile.home,
      env: {
        HOME: profile.home,
        USER: profile.user,
        LOGNAME: profile.user,
        SHELL: '/bin/bash',
        PATH: '/usr/local/bin:/usr/bin:/bin:/opt/toolkit/bin',
        PWD: profile.home,
        LANG: 'C.UTF-8',
        TERM: 'xterm-256color',
        HOSTNAME: profile.hostname,
      },
    };
  }

  get frame(): SessionFrame {
    return this.stack[this.stack.length - 1];
  }
  get fs(): VFS {
    return this.host.fileSystem(this.frame.profile.hostname);
  }
  get cwd(): string {
    return this.frame.cwd;
  }
  get env(): Record<string, string> {
    return this.frame.env;
  }
  get id(): Identity {
    return this.frame.profile.id;
  }

  /** Enters a remote session (ssh). */
  pushSession(profile: HostProfile): void {
    this.stack.push(this.newFrame(profile));
    this.host.emit({ t: 'ssh', host: profile.hostname });
  }

  popSession(): boolean {
    if (this.stack.length <= 1) return false;
    this.stack.pop();
    return true;
  }

  prompt(): string {
    const f = this.frame;
    const home = f.profile.home;
    let cwd = f.cwd;
    if (cwd === home) cwd = '~';
    else if (cwd.startsWith(home + '/')) cwd = '~' + cwd.slice(home.length);
    const sigil = f.profile.id.uid === 0 ? '#' : '$';
    return `${f.profile.user}@${f.profile.hostname}:${cwd}${sigil} `;
  }

  // ---------- expansion ----------

  resolvePath(p: string): string {
    if (p === '~') return this.env.HOME;
    if (p.startsWith('~/')) return normalize(this.env.HOME + p.slice(1));
    return normalize(p, this.cwd);
  }

  private async expandWord(word: Word): Promise<string[]> {
    // Each element: text plus whether each char came from a quoted region (for globs and splitting).
    let acc = '';
    let anyQuoted = false;
    let globbable = false;
    const fields: { text: string; glob: boolean; quoted: boolean }[] = [];
    const flushField = () => {
      fields.push({ text: acc, glob: globbable, quoted: anyQuoted });
      acc = '';
      globbable = false;
      anyQuoted = false;
    };
    for (let idx = 0; idx < word.length; idx++) {
      const part = word[idx];
      if (part.t === 'lit') {
        if (part.quoted) anyQuoted = true;
        let v = part.v;
        if (!part.quoted && idx === 0 && (v === '~' || v.startsWith('~/'))) v = this.env.HOME + v.slice(1);
        if (!part.quoted && /[*?[]/.test(v)) globbable = true;
        acc += v;
      } else {
        const value = part.t === 'var' ? this.lookupVar(part.name) : await this.commandSub(part.src);
        if (part.quoted) {
          anyQuoted = true;
          acc += value;
        } else {
          const pieces = value.split(/\s+/).filter((s) => s.length);
          pieces.forEach((p, i) => {
            if (i > 0) flushField();
            acc += p;
          });
        }
      }
    }
    if (acc.length || anyQuoted) flushField();
    const out: string[] = [];
    for (const f of fields) {
      if (f.glob) {
        const matches = this.glob(f.text);
        if (matches.length) out.push(...matches);
        else out.push(f.text);
      } else out.push(f.text);
    }
    return out;
  }

  private lookupVar(name: string): string {
    if (name === '?') return String(this.lastExit);
    if (name === '$') return '4711';
    if (name === '#') return '0';
    return this.env[name] ?? '';
  }

  private async commandSub(src: string): Promise<string> {
    const r = await this.runCapture(src);
    return r.replace(/\n+$/, '');
  }

  /** Runs a command line and returns only stdout, used by $(...). */
  private async runCapture(src: string): Promise<string> {
    this.quiet++;
    try {
      let captured = '';
      const items = parse(src);
      for (const item of items) {
        const r = await this.runPipeline(item, false, src);
        captured += r.stdout;
      }
      return captured;
    } finally {
      this.quiet--;
    }
  }

  glob(pattern: string): string[] {
    const absolute = pattern.startsWith('/');
    const segments = pattern.split('/').filter(Boolean);
    let bases: string[] = [absolute ? '/' : this.cwd];
    let shown: string[] = [absolute ? '/' : ''];
    for (const seg of segments) {
      const nextBases: string[] = [];
      const nextShown: string[] = [];
      const isGlob = /[*?[]/.test(seg);
      const re = isGlob ? globToRegExp(seg) : null;
      for (let i = 0; i < bases.length; i++) {
        const base = bases[i];
        const prefix = shown[i];
        const join = (name: string) => (prefix === '' ? name : prefix.endsWith('/') ? prefix + name : `${prefix}/${name}`);
        if (!re) {
          const p = normalize(seg, base);
          if (this.fs.lookup(p, this.id, false) || seg === '.' || seg === '..') {
            nextBases.push(p);
            nextShown.push(join(seg));
          }
          continue;
        }
        let names: string[] = [];
        try {
          names = this.fs.list(base, this.id);
        } catch {
          continue;
        }
        for (const name of names) {
          if (name.startsWith('.') && !seg.startsWith('.')) continue;
          if (re.test(name)) {
            nextBases.push(normalize(name, base));
            nextShown.push(join(name));
          }
        }
      }
      bases = nextBases;
      shown = nextShown;
    }
    return shown.filter((s) => s !== '').sort();
  }

  // ---------- execution ----------

  /** Executes a line typed at the prompt. */
  async exec(raw: string, recordHistory = true): Promise<ExecOutput> {
    let line = raw.trim();
    if (!line) return { output: '', exit: this.lastExit };
    // history expansion
    if (line === '!!' || /^!\d+$/.test(line)) {
      const entry = line === '!!' ? this.history[this.history.length - 1] : this.history[Number(line.slice(1)) - 1];
      if (!entry) {
        return { output: `bash: ${line}: event not found\n`, exit: 1 };
      }
      line = entry;
    }
    if (recordHistory) {
      if (this.history[this.history.length - 1] !== line) this.history.push(line);
      if (this.history.length > 1000) this.history.shift();
    }
    let items: ListItem[];
    try {
      items = parse(line);
    } catch (e) {
      this.lastExit = 2;
      const msg = e instanceof ParseError ? e.message : String(e);
      return { output: `bash: ${msg}\n`, exit: 2 };
    }
    let output = '';
    for (const item of items) {
      if (item.link === '&&' && this.lastExit !== 0) continue;
      if (item.link === '||' && this.lastExit === 0) continue;
      const r = await this.runPipeline(item, true, line);
      output += r.terminal;
    }
    return { output, exit: this.lastExit };
  }

  private async runPipeline(item: ListItem, isTop: boolean, raw: string): Promise<{ stdout: string; terminal: string }> {
    const cmds = item.pipeline.commands;
    let stdin: string | null = null;
    let terminal = '';
    let lastStdout = '';
    const stages: string[] = [];
    let lastName = '';
    let lastArgv: string[] = [];
    for (let i = 0; i < cmds.length; i++) {
      const isLast = i === cmds.length - 1;
      const res = await this.runSimple(cmds[i], stdin, isLast && isTop);
      stages.push(res.name);
      lastName = res.name || lastName;
      lastArgv = res.argv;
      terminal += res.stderr; // stderr of any stage reaches the terminal
      stdin = res.stdout;
      lastStdout = res.stdout;
      this.lastExit = res.exit;
      if (!this.quiet && res.name) {
        this.host.emit({
          t: 'cmd',
          name: res.name,
          argv: res.argv,
          raw,
          exit: res.exit,
          host: this.frame.profile.hostname,
          cwd: this.cwd,
          stages: cmds.length > 1 ? cmds.map((_c, j) => (j <= i ? stages[j] : '')).filter(Boolean) : [res.name],
        });
      }
    }
    void lastName;
    void lastArgv;
    terminal += lastStdout;
    return { stdout: lastStdout, terminal };
  }

  private async runSimple(cmd: SimpleCommand, stdin: string | null, isTty: boolean): Promise<{ stdout: string; stderr: string; exit: number; name: string; argv: string[] }> {
    let stdout = '';
    let stderr = '';
    // assignments
    const tempEnv: Record<string, string> = {};
    for (const a of cmd.assigns) {
      const v = (await this.expandWord(a.value)).join(' ');
      tempEnv[a.name] = v;
    }
    const argv: string[] = [];
    for (const w of cmd.words) argv.push(...(await this.expandWord(w)));

    if (argv.length === 0) {
      Object.assign(this.env, tempEnv);
      return { stdout: '', stderr: '', exit: 0, name: '', argv: [] };
    }

    // redirections
    let stdoutFile: { path: string; append: boolean } | null = null;
    let stderrFile: { path: string; append: boolean } | null = null;
    let mergeErr = false;
    let inputFromFile = stdin;
    for (const r of cmd.redirects) {
      if (r.op === '>&') {
        const t = (await this.expandWord(r.target)).join('');
        if (t === '1' && r.fd === 2) mergeErr = true;
        continue;
      }
      const target = (await this.expandWord(r.target))[0] ?? '';
      const p = this.resolvePath(target);
      if (r.op === '<') {
        try {
          inputFromFile = this.fs.read(p, this.id);
        } catch (e) {
          return { stdout: '', stderr: `bash: ${target}: ${errText(e)}\n`, exit: 1, name: '', argv: [] };
        }
      } else if (r.fd === 2) {
        stderrFile = { path: p, append: r.op === '>>' };
      } else {
        stdoutFile = { path: p, append: r.op === '>>' };
      }
    }
    const redirectedOut = stdoutFile !== null;
    const name = argv[0];
    const savedEnv: Record<string, string | undefined> = {};
    for (const k of Object.keys(tempEnv)) {
      savedEnv[k] = this.env[k];
      this.env[k] = tempEnv[k];
    }

    let exit = 127;
    const ctx: CmdCtx = {
      argv,
      stdin: inputFromFile,
      isTty: isTty && !redirectedOut,
      sh: this,
      fs: this.fs,
      id: this.id,
      out: (s) => {
        stdout += s;
      },
      err: (s) => {
        if (mergeErr) stdout += s;
        else stderr += s;
      },
      line: (s) => {
        stdout += s + '\n';
      },
      fail: (msg, code = 1) => {
        const text = `${name}: ${msg}\n`;
        if (mergeErr) stdout += text;
        else stderr += text;
        return code;
      },
    };
    try {
      const found = await this.dispatch(name, ctx);
      exit = found;
    } catch (e) {
      if (e instanceof VfsError) {
        ctx.fail(e.message);
        exit = 1;
      } else {
        ctx.fail(`internal error: ${(e as Error).message}`);
        exit = 1;
      }
    }
    for (const k of Object.keys(savedEnv)) {
      const v = savedEnv[k];
      if (v === undefined) delete this.env[k];
      else this.env[k] = v;
    }
    if (stdoutFile) {
      try {
        if (stdoutFile.path !== '/dev/null') this.fs.write(stdoutFile.path, stdout, this.id, { append: stdoutFile.append });
        stdout = '';
      } catch (e) {
        stderr += `bash: ${basename(stdoutFile.path)}: ${errText(e)}\n`;
        stdout = '';
        exit = 1;
      }
    }
    if (stderrFile) {
      try {
        if (stderrFile.path !== '/dev/null') this.fs.write(stderrFile.path, stderr, this.id, { append: stderrFile.append });
        stderr = '';
      } catch (e) {
        stderr = `bash: ${basename(stderrFile.path)}: ${errText(e)}\n`;
        exit = 1;
      }
    }
    return { stdout, stderr, exit, name, argv };
  }

  private async dispatch(name: string, ctx: CmdCtx): Promise<number> {
    // path-style invocation runs a script from the VFS
    if (name.includes('/')) return this.runScriptFile(name, ctx);
    const cmd = this.commands.get(name);
    if (!cmd || (cmd.tool && !this.host.isToolUnlocked(cmd.tool))) {
      ctx.err(`bash: ${name}: command not found\n`);
      return 127;
    }
    return cmd.run(ctx);
  }

  /** Runs a VFS text file line by line. Requires +x unless called through `sh file`. */
  async runScriptFile(path: string, ctx: CmdCtx, requireExec = true): Promise<number> {
    const p = this.resolvePath(path);
    const node = this.fs.lookup(p, this.id);
    if (!node) {
      ctx.err(`bash: ${path}: No such file or directory\n`);
      return 127;
    }
    if (node.k === 'd') {
      ctx.err(`bash: ${path}: Is a directory\n`);
      return 126;
    }
    if (requireExec && !this.fs.can(node, this.id, 1)) {
      ctx.err(`bash: ${path}: Permission denied\n`);
      return 126;
    }
    if (this.depth > 6) {
      ctx.err(`bash: ${path}: script nesting too deep\n`);
      return 1;
    }
    const src = this.fs.read(p, this.id);
    if (!/^#!|^[\x20-\x7e\n\t]/.test(src)) {
      ctx.err(`bash: ${path}: cannot execute binary file\n`);
      return 126;
    }
    this.depth++;
    let code = 0;
    try {
      for (const raw of src.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const r = await this.exec(line, false);
        ctx.out(r.output);
        code = r.exit;
        if (line === 'exit' || line.startsWith('exit ')) break;
        if (code !== 0 && src.includes('set -e')) break;
      }
    } finally {
      this.depth--;
    }
    return code;
  }

  // ---------- helpers for commands ----------

  setCwd(path: string): void {
    this.frame.oldpwd = this.frame.cwd;
    this.frame.cwd = path;
    this.env.OLDPWD = this.frame.oldpwd;
    this.env.PWD = path;
  }

  userName(uid: number): string {
    return this.frame.profile.users[uid] ?? String(uid);
  }
  groupName(gid: number): string {
    return this.frame.profile.groups[gid] ?? String(gid);
  }

  /** Runs a command with another identity, for sudo. */
  async withIdentity<T>(id: Identity, fn: () => Promise<T>): Promise<T> {
    const profile = this.frame.profile;
    const prior = profile.id;
    profile.id = id;
    try {
      return await fn();
    } finally {
      profile.id = prior;
    }
  }

  // ---------- completion ----------

  /** Returns replacement info for tab completion on the given line. */
  complete(line: string): { base: string; options: string[] } {
    const m = /(^|[\s|;&<>=])([^\s|;&<>=]*)$/.exec(line);
    const word = m ? m[2] : '';
    const before = line.slice(0, line.length - word.length);
    const isCmdPos = /(^|[|;&]\s*)$/.test(before.trimEnd() === '' ? '' : before) || before.trim() === '';
    const unq = word.replace(/^["']/, '');
    if (isCmdPos && !unq.includes('/')) {
      const names = [...this.commands.values()]
        .filter((c) => !c.tool || this.host.isToolUnlocked(c.tool))
        .map((c) => c.name)
        .filter((n) => n.startsWith(unq))
        .sort();
      return { base: unq, options: names.map((n) => n + ' ') };
    }
    const slash = unq.lastIndexOf('/');
    const dirPart = slash >= 0 ? unq.slice(0, slash + 1) : '';
    const filePart = slash >= 0 ? unq.slice(slash + 1) : unq;
    const dirPath = dirPart ? this.resolvePath(dirPart) : this.cwd;
    let names: string[] = [];
    try {
      names = this.fs.list(dirPath, this.id);
    } catch {
      return { base: unq, options: [] };
    }
    const hits = names
      .filter((n) => n.startsWith(filePart) && (filePart.startsWith('.') || !n.startsWith('.')))
      .map((n) => {
        const full = normalize(n, dirPath);
        const isDir = this.fs.isDir(full, this.id);
        return dirPart + n + (isDir ? '/' : ' ');
      });
    return { base: unq, options: hits };
  }
}

export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export { dirname, basename, ROOT };
