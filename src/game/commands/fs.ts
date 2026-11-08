import { basename, FileNode, modeString, normalize, VfsError, VNode } from '../filesystem/vfs';
import { globToRegExp } from '../terminal/parser';
import type { CmdCtx, Command } from '../terminal/types';
import { ANSI, humanSize, isoTime, lsTime, pad, parseArgs, toBytes } from './args';
import { sniffType } from './magic';
import { manual } from './manual';

function colorName(name: string, n: VNode, tty: boolean): string {
  if (!tty) return name;
  if (n.k === 'd') return `${ANSI.dir}${name}${ANSI.reset}`;
  if (n.k === 'l') return `${ANSI.link}${name}${ANSI.reset}`;
  if (n.mode & 0o111) return `${ANSI.exec}${name}${ANSI.reset}`;
  return name;
}

function columns(names: { plain: string; shown: string }[], width: number): string {
  if (!names.length) return '';
  const maxLen = Math.max(...names.map((n) => n.plain.length)) + 2;
  const cols = Math.max(1, Math.floor(width / maxLen));
  const rows = Math.ceil(names.length / cols);
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const item = names[r + c * rows];
      if (!item) continue;
      const isLastCol = r + (c + 1) * rows >= names.length;
      line += item.shown + (isLastCol ? '' : ' '.repeat(maxLen - item.plain.length));
    }
    lines.push(line);
  }
  return lines.join('\n') + '\n';
}

const ls: Command = {
  name: 'ls',
  man: manual('ls', ['ls [-laAhRtrSd1F] [FILE]...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'laAhRtrSd1F', long: { all: 'a', 'almost-all': 'A', 'human-readable': 'h', recursive: 'R', reverse: 'r', directory: 'd' } });
    if (a.unknown) return ctx.fail(`invalid option -- '${a.unknown.replace(/^-+/, '')}'\nTry 'man ls' for more information.`, 2);
    const targets = a.rest.length ? a.rest : ['.'];
    const f = a.flags;
    let code = 0;
    const now = ctx.sh.host.now();
    const width = Number(ctx.sh.env.COLUMNS) || 96;

    const sortEntries = (dir: string, names: string[]): string[] => {
      let out = [...names];
      const nodeOf = (n: string) => ctx.fs.lookup(n === '.' || n === '..' ? normalize(n, dir) : `${dir === '/' ? '' : dir}/${n}`, ctx.id, false);
      if (f.has('t')) out.sort((x, y) => (nodeOf(y)?.mtime ?? 0) - (nodeOf(x)?.mtime ?? 0));
      else if (f.has('S')) out.sort((x, y) => ctx.fs.size(nodeOf(y)!) - ctx.fs.size(nodeOf(x)!));
      if (f.has('r')) out = out.reverse();
      return out;
    };

    const longLines = (entries: { name: string; node: VNode }[]): string[] => {
      const sizes = entries.map((e) => (f.has('h') ? humanSize(ctx.fs.size(e.node)) : String(ctx.fs.size(e.node))));
      const owners = entries.map((e) => ctx.sh.userName(e.node.uid));
      const groups = entries.map((e) => ctx.sh.groupName(e.node.gid));
      const sw = Math.max(...sizes.map((s) => s.length), 1);
      const ow = Math.max(...owners.map((s) => s.length), 1);
      const gw = Math.max(...groups.map((s) => s.length), 1);
      return entries.map((e, i) => {
        const links = e.node.k === 'd' ? 2 : 1;
        const shown = colorName(e.name, e.node, ctx.isTty) + (e.node.k === 'l' ? ` -> ${e.node.target}` : '');
        return `${modeString(e.node)} ${links} ${owners[i].padEnd(ow)} ${groups[i].padEnd(gw)} ${sizes[i].padStart(sw)} ${lsTime(e.node.mtime, now)} ${shown}`;
      });
    };

    const emit = (entries: { name: string; node: VNode }[]) => {
      if (!entries.length) return;
      if (f.has('l')) {
        for (const l of longLines(entries)) ctx.line(l);
      } else if (!ctx.isTty || f.has('1')) {
        for (const e of entries) ctx.line(e.name);
      } else {
        ctx.out(columns(entries.map((e) => ({ plain: e.name + (f.has('F') && e.node.k === 'd' ? '/' : ''), shown: colorName(e.name, e.node, true) + (f.has('F') && e.node.k === 'd' ? '/' : '') })), width));
      }
    };

    const plainFiles: { name: string; node: VNode }[] = [];
    const dirs: { shown: string; path: string }[] = [];
    for (const t of targets) {
      const p = ctx.sh.resolvePath(t);
      try {
        const n = ctx.fs.stat(p, ctx.id, !f.has('l'));
        if (n.k === 'd' && !f.has('d')) dirs.push({ shown: t, path: p });
        else plainFiles.push({ name: t, node: n });
      } catch (e) {
        ctx.fail(`cannot access '${t}': ${(e as Error).message}`);
        code = 2;
      }
    }
    emit(plainFiles);
    const showHeaders = targets.length > 1 || f.has('R');

    const listDir = (shown: string, path: string, first: boolean) => {
      if (showHeaders) ctx.line(`${first && !plainFiles.length ? '' : '\n'}${shown}:`);
      let names: string[];
      try {
        names = ctx.fs.list(path, ctx.id);
      } catch (e) {
        ctx.fail(`cannot open directory '${shown}': ${(e as Error).message}`);
        code = 2;
        return;
      }
      if (!f.has('a') && !f.has('A')) names = names.filter((n) => !n.startsWith('.'));
      const withDots = f.has('a') ? ['.', '..', ...names] : names;
      const sorted = sortEntries(path, withDots);
      const entries = sorted.map((name) => ({
        name,
        node: ctx.fs.lookup(name === '.' || name === '..' ? normalize(name, path) : `${path === '/' ? '' : path}/${name}`, ctx.id, false)!,
      }));
      if (f.has('l')) {
        const blocks = entries.reduce((acc, e) => acc + Math.ceil(ctx.fs.size(e.node) / 1024), 0);
        ctx.line(`total ${blocks}`);
      }
      emit(entries);
      if (f.has('R')) {
        for (const e of entries) {
          if (e.node.k === 'd' && e.name !== '.' && e.name !== '..') {
            listDir(`${shown.replace(/\/$/, '')}/${e.name}`, normalize(e.name, path), false);
          }
        }
      }
    };
    dirs.forEach((d, i) => listDir(d.shown, d.path, i === 0));
    return code;
  },
};

const pwd: Command = {
  name: 'pwd',
  man: manual('pwd', ['pwd']),
  run(ctx) {
    ctx.line(ctx.sh.cwd);
    return 0;
  },
};

const cd: Command = {
  name: 'cd',
  man: manual('cd', ['cd [DIR]', 'cd -', 'cd ..']),
  run(ctx) {
    const arg = ctx.argv[1];
    if (ctx.argv.length > 2) return ctx.fail('too many arguments');
    let target: string;
    if (!arg) target = ctx.sh.env.HOME;
    else if (arg === '-') {
      target = ctx.sh.frame.oldpwd;
      ctx.line(target);
    } else target = ctx.sh.resolvePath(arg);
    let n: VNode;
    try {
      n = ctx.fs.stat(target, ctx.id);
    } catch (e) {
      return ctx.fail(`${arg}: ${(e as Error).message}`);
    }
    if (n.k !== 'd') return ctx.fail(`${arg}: Not a directory`);
    if (!ctx.fs.can(n, ctx.id, 1)) return ctx.fail(`${arg}: Permission denied`);
    ctx.sh.setCwd(target);
    return 0;
  },
};

const mkdir: Command = {
  name: 'mkdir',
  man: manual('mkdir', ['mkdir [-p] DIR...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'p', long: { parents: 'p' } });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    if (!a.rest.length) return ctx.fail('missing operand');
    let code = 0;
    for (const d of a.rest) {
      try {
        ctx.fs.mkdir(ctx.sh.resolvePath(d), ctx.id, a.flags.has('p'));
      } catch (e) {
        ctx.fail(`cannot create directory '${d}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

const rmdir: Command = {
  name: 'rmdir',
  man: manual('rmdir', ['rmdir DIR...']),
  run(ctx) {
    if (ctx.argv.length < 2) return ctx.fail('missing operand');
    let code = 0;
    for (const d of ctx.argv.slice(1)) {
      try {
        ctx.fs.rmdir(ctx.sh.resolvePath(d), ctx.id);
      } catch (e) {
        ctx.fail(`failed to remove '${d}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

const touch: Command = {
  name: 'touch',
  man: manual('touch', ['touch FILE...']),
  run(ctx) {
    if (ctx.argv.length < 2) return ctx.fail('missing file operand');
    let code = 0;
    for (const f of ctx.argv.slice(1)) {
      try {
        ctx.fs.touch(ctx.sh.resolvePath(f), ctx.id);
      } catch (e) {
        ctx.fail(`cannot touch '${f}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

function destFor(ctx: CmdCtx, src: string, dest: string): string {
  const d = ctx.sh.resolvePath(dest);
  return ctx.fs.isDir(d, ctx.id) ? normalize(basename(src), d) : d;
}

const cp: Command = {
  name: 'cp',
  man: manual('cp', ['cp [-r] SOURCE DEST', 'cp [-r] SOURCE... DIR']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'rRvfpa', long: { recursive: 'r' } });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    if (a.rest.length < 2) return ctx.fail(a.rest.length ? `missing destination file operand after '${a.rest[0]}'` : 'missing file operand');
    const recursive = a.flags.has('r') || a.flags.has('R') || a.flags.has('a');
    const dest = a.rest[a.rest.length - 1];
    const srcs = a.rest.slice(0, -1);
    if (srcs.length > 1 && !ctx.fs.isDir(ctx.sh.resolvePath(dest), ctx.id)) return ctx.fail(`target '${dest}': Not a directory`);
    let code = 0;
    for (const s of srcs) {
      const sp = ctx.sh.resolvePath(s);
      try {
        const n = ctx.fs.stat(sp, ctx.id);
        const out = destFor(ctx, sp, dest);
        if (out === sp) {
          ctx.fail(`'${s}' and '${dest}' are the same file`);
          code = 1;
          continue;
        }
        if (n.k === 'd') {
          if (!recursive) {
            ctx.fail(`-r not specified; omitting directory '${s}'`);
            code = 1;
            continue;
          }
          ctx.fs.copyTree(sp, out, ctx.id);
        } else ctx.fs.copyFile(sp, out, ctx.id);
      } catch (e) {
        ctx.fail(`cannot copy '${s}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

const mv: Command = {
  name: 'mv',
  man: manual('mv', ['mv SOURCE DEST', 'mv SOURCE... DIR']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'fv' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    if (a.rest.length < 2) return ctx.fail(a.rest.length ? `missing destination file operand after '${a.rest[0]}'` : 'missing file operand');
    const dest = a.rest[a.rest.length - 1];
    const srcs = a.rest.slice(0, -1);
    if (srcs.length > 1 && !ctx.fs.isDir(ctx.sh.resolvePath(dest), ctx.id)) return ctx.fail(`target '${dest}': Not a directory`);
    let code = 0;
    for (const s of srcs) {
      try {
        const sp = ctx.sh.resolvePath(s);
        ctx.fs.move(sp, destFor(ctx, sp, dest), ctx.id);
      } catch (e) {
        ctx.fail(`cannot move '${s}' to '${dest}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

const rm: Command = {
  name: 'rm',
  man: manual('rm', ['rm [-rf] FILE...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'rRfiv', long: { recursive: 'r', force: 'f' } });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const force = a.flags.has('f');
    const rec = a.flags.has('r') || a.flags.has('R');
    if (!a.rest.length) return force ? 0 : ctx.fail('missing operand');
    let code = 0;
    for (const f of a.rest) {
      const p = ctx.sh.resolvePath(f);
      try {
        const n = ctx.fs.stat(p, ctx.id, false);
        if (n.k === 'd') {
          if (!rec) {
            ctx.fail(`cannot remove '${f}': Is a directory`);
            code = 1;
            continue;
          }
          if (p === '/') {
            ctx.fail("it is dangerous to operate recursively on '/'");
            code = 1;
            continue;
          }
          ctx.fs.rmdir(p, ctx.id, true);
        } else ctx.fs.unlink(p, ctx.id);
      } catch (e) {
        if (force && e instanceof VfsError && e.code === 'ENOENT') continue;
        ctx.fail(`cannot remove '${f}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

const stat: Command = {
  name: 'stat',
  man: manual('stat', ['stat FILE...']),
  run(ctx) {
    if (ctx.argv.length < 2) return ctx.fail('missing operand');
    let code = 0;
    for (const f of ctx.argv.slice(1)) {
      try {
        const n = ctx.fs.stat(ctx.sh.resolvePath(f), ctx.id, false);
        const type = n.k === 'd' ? 'directory' : n.k === 'l' ? 'symbolic link' : ctx.fs.size(n) === 0 ? 'regular empty file' : 'regular file';
        const octal = (n.mode & 0o7777).toString(8).padStart(4, '0');
        ctx.line(`  File: ${f}${n.k === 'l' ? ` -> ${n.target}` : ''}`);
        ctx.line(`  Size: ${String(ctx.fs.size(n)).padEnd(15)} Blocks: ${String(Math.ceil(ctx.fs.size(n) / 512)).padEnd(10)} ${type}`);
        ctx.line(`Access: (${octal}/${modeString(n)})  Uid: (${pad(n.uid, 5)}/${pad(ctx.sh.userName(n.uid), 8)})   Gid: (${pad(n.gid, 5)}/${pad(ctx.sh.groupName(n.gid), 8)})`);
        ctx.line(`Modify: ${isoTime(n.mtime)}`);
        ctx.line(`Change: ${isoTime(n.mtime)}`);
      } catch (e) {
        ctx.fail(`cannot statx '${f}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

function parseChmod(spec: string, current: number, isDir: boolean): number | null {
  if (/^[0-7]{1,4}$/.test(spec)) return parseInt(spec, 8);
  let mode = current;
  for (const clause of spec.split(',')) {
    const m = /^([ugoa]*)([+\-=])([rwxX]*)$/.exec(clause);
    if (!m) return null;
    const who = m[1] || 'a';
    let bits = 0;
    if (m[3].includes('r')) bits |= 4;
    if (m[3].includes('w')) bits |= 2;
    if (m[3].includes('x')) bits |= 1;
    if (m[3].includes('X') && (isDir || (current & 0o111) !== 0)) bits |= 1;
    for (const w of who === 'a' ? 'ugo' : who) {
      const shift = w === 'u' ? 6 : w === 'g' ? 3 : 0;
      if (m[2] === '+') mode |= bits << shift;
      else if (m[2] === '-') mode &= ~(bits << shift);
      else mode = (mode & ~(7 << shift)) | (bits << shift);
    }
  }
  return mode;
}

const chmod: Command = {
  name: 'chmod',
  man: manual('chmod', ['chmod MODE FILE...', 'chmod [-R] MODE DIR']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'R', long: { recursive: 'R' } });
    const raw = ctx.argv.slice(1).filter((s) => s !== '-R' && s !== '--recursive');
    if (raw.length < 2) return ctx.fail(raw.length ? `missing operand after '${raw[0]}'` : 'missing operand');
    void a;
    const [spec, ...files] = raw;
    let code = 0;
    for (const f of files) {
      const p = ctx.sh.resolvePath(f);
      try {
        const apply = (path: string, n: VNode) => {
          const m = parseChmod(spec, n.mode & 0o7777, n.k === 'd');
          if (m === null) throw new Error(`invalid mode: '${spec}'`);
          ctx.fs.chmod(path, m, ctx.id);
        };
        if (ctx.argv.includes('-R')) ctx.fs.walkTree(p, ctx.id, apply);
        else apply(p, ctx.fs.stat(p, ctx.id));
      } catch (e) {
        const msg = (e as Error).message;
        ctx.fail(msg.startsWith('invalid mode') ? msg : `cannot access '${f}': ${msg}`);
        code = 1;
      }
    }
    return code;
  },
};

const ln: Command = {
  name: 'ln',
  man: manual('ln', ['ln -s TARGET LINK']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 's' });
    if (!a.flags.has('s')) return ctx.fail('only symbolic links are supported here; use -s');
    if (a.rest.length !== 2) return ctx.fail('usage: ln -s TARGET LINK');
    ctx.fs.symlink(a.rest[0], ctx.sh.resolvePath(a.rest[1]), ctx.id);
    return 0;
  },
};

const find: Command = {
  name: 'find',
  man: manual('find', ['find [PATH...] [-name GLOB] [-iname GLOB] [-type f|d|l] [-maxdepth N] [-user NAME] [-perm MODE] [-size [+-]N[ckM]]']),
  run(ctx) {
    const args = ctx.argv.slice(1);
    const roots: string[] = [];
    while (args.length && !args[0].startsWith('-')) roots.push(args.shift()!);
    if (!roots.length) roots.push('.');
    type Test = (path: string, n: VNode, depth: number) => boolean;
    const tests: Test[] = [];
    let maxDepth = Infinity;
    for (let i = 0; i < args.length; i++) {
      const opt = args[i];
      const val = args[i + 1];
      const need = () => {
        if (val === undefined) throw new Error(`missing argument to \`${opt}'`);
        i++;
        return val;
      };
      if (opt === '-name' || opt === '-iname') {
        const v = need();
        const re = globToRegExp(opt === '-iname' ? v.toLowerCase() : v);
        tests.push((p) => re.test(opt === '-iname' ? basename(p).toLowerCase() : basename(p)));
      } else if (opt === '-path') {
        const re = new RegExp('^' + need().replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        tests.push((p) => re.test(p));
      } else if (opt === '-type') {
        const v = need();
        if (!'fdl'.includes(v)) return ctx.fail(`Unknown argument to -type: ${v}`);
        tests.push((_p, n) => n.k === v);
      } else if (opt === '-maxdepth') {
        maxDepth = Number(need());
        if (!Number.isInteger(maxDepth)) return ctx.fail('expected a non-negative integer argument to -maxdepth');
      } else if (opt === '-user') {
        const v = need();
        tests.push((_p, n) => ctx.sh.userName(n.uid) === v);
      } else if (opt === '-perm') {
        const v = parseInt(need(), 8);
        tests.push((_p, n) => (n.mode & 0o777) === v);
      } else if (opt === '-size') {
        const m = /^([+-]?)(\d+)([ckMG]?)$/.exec(need());
        if (!m) return ctx.fail('invalid -size argument');
        const unit = m[3] === 'k' ? 1024 : m[3] === 'M' ? 1048576 : m[3] === 'G' ? 1073741824 : m[3] === 'c' ? 1 : 512;
        const want = Number(m[2]) * unit;
        tests.push((_p, n) => {
          const s = ctx.fs.size(n);
          return m[1] === '+' ? s > want : m[1] === '-' ? s < want : Math.ceil(s / unit) === Number(m[2]);
        });
      } else if (opt === '-print') {
        continue;
      } else {
        return ctx.fail(`unknown predicate \`${opt}'`);
      }
    }
    let code = 0;
    for (const root of roots) {
      const start = ctx.sh.resolvePath(root);
      if (!ctx.fs.exists(start, ctx.id)) {
        ctx.fail(`'${root}': No such file or directory`);
        code = 1;
        continue;
      }
      const startDepth = start === '/' ? 0 : start.split('/').length - 1;
      const walk = (path: string) => {
        const shownPath = path === start ? root : root.replace(/\/$/, '') + path.slice(start === '/' ? 0 : start.length);
        const n = ctx.fs.lookup(path, ctx.id, false);
        if (!n) return;
        const depth = (path === '/' ? 0 : path.split('/').length - 1) - startDepth;
        if (tests.every((t) => t(path, n, depth))) ctx.line(shownPath);
        if (n.k !== 'd' || depth >= maxDepth) return;
        if (!ctx.fs.can(n, ctx.id, 4) || !ctx.fs.can(n, ctx.id, 1)) {
          ctx.err(`find: '${shownPath}': Permission denied\n`);
          code = 1;
          return;
        }
        for (const name of Object.keys(n.c).sort()) walk(path === '/' ? `/${name}` : `${path}/${name}`);
      };
      walk(start);
    }
    return code;
  },
};

const file: Command = {
  name: 'file',
  man: manual('file', ['file FILE...']),
  run(ctx) {
    if (ctx.argv.length < 2) return ctx.fail('missing file operand');
    for (const f of ctx.argv.slice(1)) {
      const p = ctx.sh.resolvePath(f);
      try {
        const n = ctx.fs.stat(p, ctx.id);
        if (n.k === 'd') {
          ctx.line(`${f}: directory`);
          continue;
        }
        if ((n as FileNode).db) {
          ctx.fs.read(p, ctx.id);
          ctx.line(`${f}: SQLite 3.x database, last written using SQLite version 3045001`);
          continue;
        }
        ctx.line(`${f}: ${sniffType(ctx.fs.read(p, ctx.id))}`);
      } catch (e) {
        if (e instanceof VfsError && e.code === 'ENOENT') ctx.line(`${f}: cannot open \`${f}' (No such file or directory)`);
        else ctx.line(`${f}: cannot open \`${f}' (${(e as Error).message})`);
      }
    }
    return 0;
  },
};

const du: Command = {
  name: 'du',
  man: manual('du', ['du [-sh] [PATH...]']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'sh' });
    let code = 0;
    for (const r of a.rest.length ? a.rest : ['.']) {
      const p = ctx.sh.resolvePath(r);
      const fmt = (n: number) => (a.flags.has('h') ? humanSize(n) : String(Math.ceil(n / 1024)));
      try {
        const totals = new Map<string, number>();
        ctx.fs.walkTree(p, ctx.id, (path, n) => {
          if (n.k !== 'f') return;
          const sz = toBytes(ctx.fs.fileContent(n)).length;
          let cur = path;
          while (cur.length >= p.length) {
            totals.set(cur, (totals.get(cur) ?? 0) + sz);
            if (cur === '/' || cur === p) break;
            cur = cur.slice(0, cur.lastIndexOf('/')) || '/';
          }
        });
        if (a.flags.has('s')) ctx.line(`${fmt(totals.get(p) ?? 0)}\t${r}`);
        else for (const [k, v] of [...totals.entries()].reverse()) if (ctx.fs.isDir(k, ctx.id)) ctx.line(`${fmt(v)}\t${r.replace(/\/$/, '')}${k.slice(p.length)}`);
      } catch (e) {
        ctx.fail(`cannot access '${r}': ${(e as Error).message}`);
        code = 1;
      }
    }
    return code;
  },
};

export const fsCommands: Command[] = [pwd, ls, cd, mkdir, rmdir, touch, cp, mv, rm, stat, chmod, ln, find, file, du];
