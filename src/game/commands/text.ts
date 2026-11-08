import type { CmdCtx, Command, FullScreen } from '../terminal/types';
import { ANSI, eachInput, pad, parseArgs, splitLines } from './args';
import { manual } from './manual';

const cat: Command = {
  name: 'cat',
  man: manual('cat', ['cat [-n] [FILE]...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'n' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    let n = 1;
    return eachInput(ctx, a.rest, (text) => {
      if (!a.flags.has('n')) ctx.out(text);
      else for (const l of splitLines(text)) ctx.line(`${pad(n++, 6)}\t${l}`);
    });
  },
};

const echo: Command = {
  name: 'echo',
  man: manual('echo', ['echo [-n] [-e] [STRING]...']),
  run(ctx) {
    let args = ctx.argv.slice(1);
    let nl = true;
    let esc = false;
    while (args[0] === '-n' || args[0] === '-e') {
      if (args[0] === '-n') nl = false;
      else esc = true;
      args = args.slice(1);
    }
    let text = args.join(' ');
    if (esc) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    ctx.out(text + (nl ? '\n' : ''));
    return 0;
  },
};

export function pagerFor(title: string, text: string): FullScreen {
  const lines = splitLines(text);
  let top = 0;
  let quit = false;
  let rowsSeen = 24;
  let searchTerm: string | null = null;
  let typing: string | null = null;
  let message = '';
  const search = (dir: 1 | -1) => {
    if (!searchTerm) return;
    const lower = searchTerm.toLowerCase();
    for (let i = top + dir; i >= 0 && i < lines.length; i += dir) {
      if (lines[i].toLowerCase().includes(lower)) {
        top = i;
        message = '';
        return;
      }
    }
    message = 'Pattern not found';
  };
  return {
    title,
    render(rows) {
      rowsSeen = rows;
      const maxTop = Math.max(0, lines.length - rows);
      if (top > maxTop) top = maxTop;
      const view = lines.slice(top, top + rows);
      if (!searchTerm) return view;
      const re = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return view.map((l) => l.replace(re, (m) => `${ANSI.match}${m}${ANSI.reset}`));
    },
    status() {
      if (typing !== null) return `/${typing}`;
      if (message) return message;
      const end = Math.min(lines.length, top + rowsSeen);
      const pct = lines.length ? Math.round((end / lines.length) * 100) : 100;
      return `${title}  lines ${lines.length ? top + 1 : 0}-${end}/${lines.length} ${pct}%  (q quit, / search, n next)`;
    },
    key(k) {
      if (typing !== null) {
        if (k === 'Enter') {
          searchTerm = typing || searchTerm;
          typing = null;
          top = Math.max(-1, top);
          const saved = top;
          top = saved - 1 < -1 ? -1 : saved;
          search(1);
          if (top < 0) top = 0;
        } else if (k === 'Escape') typing = null;
        else if (k === 'Backspace') typing = typing.slice(0, -1);
        else if (k.length === 1) typing += k;
        return;
      }
      message = '';
      const maxTop = Math.max(0, lines.length - rowsSeen);
      switch (k) {
        case 'q':
        case 'Escape':
          quit = true;
          break;
        case 'j':
        case 'ArrowDown':
        case 'Enter':
          top = Math.min(maxTop, top + 1);
          break;
        case 'k':
        case 'ArrowUp':
          top = Math.max(0, top - 1);
          break;
        case ' ':
        case 'f':
        case 'PageDown':
          top = Math.min(maxTop, top + rowsSeen - 1);
          break;
        case 'b':
        case 'PageUp':
          top = Math.max(0, top - rowsSeen + 1);
          break;
        case 'g':
        case 'Home':
          top = 0;
          break;
        case 'G':
        case 'End':
          top = maxTop;
          break;
        case '/':
          typing = '';
          break;
        case 'n':
          search(1);
          break;
        case 'N':
          search(-1);
          break;
      }
    },
    done: () => quit,
  };
}

const less: Command = {
  name: 'less',
  man: manual('less', ['less FILE', 'COMMAND | less']),
  run(ctx) {
    const files = ctx.argv.slice(1).filter((s) => !s.startsWith('-'));
    let buf = '';
    const code = eachInput(ctx, files, (t) => {
      buf += t;
    });
    if (code) return code;
    if (!ctx.isTty) {
      ctx.out(buf);
      return 0;
    }
    ctx.sh.fullscreen = pagerFor(files[0] ?? '(stdin)', buf);
    return 0;
  },
};

function headTail(name: 'head' | 'tail'): Command {
  return {
    name,
    man: manual(name, name === 'head' ? ['head [-n N] [FILE]...', 'head -N [FILE]'] : ['tail [-n N] [FILE]...', 'tail -n +N FILE']),
    run(ctx) {
      const argv = ctx.argv.slice(1).map((s) => (/^-\d+$/.test(s) ? `-n${s.slice(1)}` : s));
      const a = parseArgs(argv, { flags: 'qv', values: 'nc', long: { 'lines=': 'n', 'bytes=': 'c' } });
      if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
      const spec = a.values.n ?? '10';
      const fromStart = spec.startsWith('+');
      const n = Number(spec.replace(/^[+-]/, ''));
      if (!Number.isInteger(n)) return ctx.fail(`invalid number of lines: '${spec}'`);
      const multi = a.rest.length > 1;
      return eachInput(ctx, a.rest, (text, label) => {
        if (multi) ctx.line(`==> ${label} <==`);
        if (a.values.c) {
          const c = Number(a.values.c);
          ctx.out(name === 'head' ? text.slice(0, c) : text.slice(-c));
          return;
        }
        const lines = splitLines(text);
        const pick = name === 'head' ? lines.slice(0, n) : fromStart ? lines.slice(Math.max(0, n - 1)) : lines.slice(Math.max(0, lines.length - n));
        for (const l of pick) ctx.line(l);
      });
    },
  };
}

/** Converts a basic regex (grep default) to a JS one; -E passes through. */
function compilePattern(pat: string, opts: { ere: boolean; fixed: boolean; word: boolean; icase: boolean; global?: boolean }): RegExp {
  let src = pat;
  if (opts.fixed) src = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  else if (!opts.ere) {
    // BRE: + ? | ( ) { } are literal unless escaped
    let out = '';
    for (let i = 0; i < pat.length; i++) {
      const c = pat[i];
      if (c === '\\' && i + 1 < pat.length) {
        const d = pat[++i];
        out += '+?|(){}'.includes(d) ? d : `\\${d}`;
      } else if ('+?|(){}'.includes(c)) out += `\\${c}`;
      else if (c === '[') {
        const end = pat.indexOf(']', i + 2);
        if (end < 0) {
          out += c;
          continue;
        }
        out += pat.slice(i, end + 1);
        i = end;
      } else out += c;
    }
    src = out;
  }
  src = src.replace(/\[:(alpha|digit|alnum|space|upper|lower):\]/g, (_m, c: string) => ({ alpha: 'a-zA-Z', digit: '0-9', alnum: 'a-zA-Z0-9', space: '\\s', upper: 'A-Z', lower: 'a-z' })[c] ?? '');
  if (opts.word) src = `\\b(?:${src})\\b`;
  return new RegExp(src, (opts.icase ? 'i' : '') + (opts.global ? 'g' : ''));
}

const grep: Command = {
  name: 'grep',
  man: manual('grep', ['grep [-ivnclrEowFH] [-A N] [-B N] PATTERN [FILE]...', 'COMMAND | grep PATTERN']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'ivnclrREowFHhs', values: 'ABCe', long: { 'ignore-case': 'i', 'invert-match': 'v', 'line-number': 'n', count: 'c', recursive: 'r', 'only-matching': 'o', 'files-with-matches': 'l' } });
    if (a.unknown) return ctx.fail(`invalid option -- '${a.unknown.replace(/^-+/, '')}'\nUsage: grep [OPTION]... PATTERNS [FILE]...`, 2);
    const f = a.flags;
    const rest = [...a.rest];
    const pattern = a.values.e ?? rest.shift();
    if (pattern === undefined) return ctx.fail('Usage: grep [OPTION]... PATTERNS [FILE]...', 2);
    let re: RegExp;
    try {
      re = compilePattern(pattern, { ere: f.has('E'), fixed: f.has('F'), word: f.has('w'), icase: f.has('i') });
    } catch {
      return ctx.fail('Invalid regular expression', 2);
    }
    const rec = f.has('r') || f.has('R');
    let files = rest;
    if (rec) {
      const expanded: string[] = [];
      for (const r of files.length ? files : ['.']) {
        const p = ctx.sh.resolvePath(r);
        try {
          ctx.fs.walkTree(
            p,
            ctx.id,
            (path, n) => {
              if (n.k === 'f') expanded.push(r === '.' ? '.' + path.slice(ctx.sh.cwd === '/' ? 0 : ctx.sh.cwd.length) : r.replace(/\/$/, '') + path.slice(p.length));
            },
            (d) => ctx.err(`grep: ${d}: Permission denied\n`),
          );
        } catch (e) {
          ctx.fail(`${r}: ${(e as Error).message}`);
        }
      }
      files = expanded;
    }
    const showName = (files.length > 1 || rec || f.has('H')) && !f.has('h');
    const after = Number(a.values.A ?? a.values.C ?? 0);
    const before = Number(a.values.B ?? a.values.C ?? 0);
    let matched = false;
    let code = 0;
    const scan = (text: string, label: string) => {
      const lines = splitLines(text);
      let count = 0;
      let lastPrinted = -1;
      let afterLeft = 0;
      const colored = (l: string) => {
        if (!ctx.isTty || f.has('v')) return l;
        const g = new RegExp(re.source, re.flags + 'g');
        return l.replace(g, (m) => (m ? `${ANSI.match}${m}${ANSI.reset}` : m));
      };
      const prefix = (i: number, sep: string) => (showName ? `${label}${sep}` : '') + (f.has('n') ? `${i + 1}${sep}` : '');
      for (let i = 0; i < lines.length; i++) {
        const hit = re.test(lines[i]) !== f.has('v');
        if (hit) {
          count++;
          matched = true;
          if (f.has('c') || f.has('l')) continue;
          if (f.has('o') && !f.has('v')) {
            const g = new RegExp(re.source, re.flags + 'g');
            for (const m of lines[i].matchAll(g)) if (m[0]) ctx.line(prefix(i, ':') + m[0]);
            continue;
          }
          if ((before || after) && lastPrinted >= 0 && i - before > lastPrinted + 1) ctx.line('--');
          for (let b = Math.max(lastPrinted + 1, i - before); b < i; b++) ctx.line(prefix(b, '-') + lines[b]);
          ctx.line(prefix(i, ':') + colored(lines[i]));
          lastPrinted = i;
          afterLeft = after;
        } else if (afterLeft > 0 && !f.has('c') && !f.has('l')) {
          ctx.line(prefix(i, '-') + lines[i]);
          lastPrinted = i;
          afterLeft--;
        }
      }
      if (f.has('c')) ctx.line((showName ? `${label}:` : '') + count);
      if (f.has('l') && count) ctx.line(label);
    };
    if (!files.length && !rec) scan(ctx.stdin ?? '', '(standard input)');
    for (const file of files) {
      try {
        const p = ctx.sh.resolvePath(file);
        scan(ctx.fs.read(p, ctx.id), file);
      } catch (e) {
        if (!f.has('s')) ctx.fail(`${file}: ${(e as Error).message}`);
        code = 2;
      }
    }
    return code || (matched ? 0 : 1);
  },
};

const wc: Command = {
  name: 'wc',
  man: manual('wc', ['wc [-lwc] [FILE]...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'lwcm' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const f = a.flags;
    const all = !f.has('l') && !f.has('w') && !f.has('c') && !f.has('m');
    const rows: { nums: number[]; label: string }[] = [];
    const code = eachInput(ctx, a.rest, (text, label) => {
      const nums: number[] = [];
      if (all || f.has('l')) nums.push((text.match(/\n/g) ?? []).length);
      if (all || f.has('w')) nums.push(text.split(/\s+/).filter(Boolean).length);
      if (all || f.has('c') || f.has('m')) nums.push(text.length);
      rows.push({ nums, label: a.rest.length ? label : '' });
    });
    if (rows.length > 1) rows.push({ nums: rows[0].nums.map((_, i) => rows.reduce((s, r) => s + r.nums[i], 0)), label: 'total' });
    const width = rows.length > 1 || all ? Math.max(...rows.flatMap((r) => r.nums.map((n) => String(n).length)), 1) + 1 : 0;
    for (const r of rows) {
      const nums = r.nums.map((n) => (width ? pad(n, width) : String(n))).join(' ');
      ctx.line(r.label ? `${nums} ${r.label}` : nums);
    }
    return code;
  },
};

function readAllLines(ctx: CmdCtx, files: string[]): { lines: string[]; code: number } {
  const lines: string[] = [];
  const code = eachInput(ctx, files, (t) => {
    lines.push(...splitLines(t));
  });
  return { lines, code };
}

const sort: Command = {
  name: 'sort',
  man: manual('sort', ['sort [-rnufb] [-t SEP] [-k FIELD] [FILE]...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'rnufb', values: 'tk' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const { lines, code } = readAllLines(ctx, a.rest);
    const key = (l: string) => {
      if (!a.values.k) return l;
      const field = parseInt(a.values.k, 10) - 1;
      const parts = a.values.t ? l.split(a.values.t) : l.trim().split(/\s+/);
      return parts.slice(field).join(a.values.t ?? ' ');
    };
    const cmp = (x: string, y: string) => {
      const kx = key(x);
      const ky = key(y);
      if (a.flags.has('n')) {
        const nx = parseFloat(kx) || 0;
        const ny = parseFloat(ky) || 0;
        if (nx !== ny) return nx - ny;
        return x < y ? -1 : x > y ? 1 : 0;
      }
      const sx = a.flags.has('f') ? kx.toLowerCase() : kx;
      const sy = a.flags.has('f') ? ky.toLowerCase() : ky;
      return sx < sy ? -1 : sx > sy ? 1 : 0;
    };
    const sorted = [...lines].sort(cmp);
    if (a.flags.has('r')) sorted.reverse();
    let out = sorted;
    if (a.flags.has('u')) out = sorted.filter((l, i) => i === 0 || l !== sorted[i - 1]);
    for (const l of out) ctx.line(l);
    return code;
  },
};

const uniq: Command = {
  name: 'uniq',
  man: manual('uniq', ['uniq [-cdui] [FILE]']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'cdui' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const { lines, code } = readAllLines(ctx, a.rest);
    const eq = (x: string, y: string) => (a.flags.has('i') ? x.toLowerCase() === y.toLowerCase() : x === y);
    const groups: { line: string; n: number }[] = [];
    for (const l of lines) {
      const last = groups[groups.length - 1];
      if (last && eq(last.line, l)) last.n++;
      else groups.push({ line: l, n: 1 });
    }
    for (const g of groups) {
      if (a.flags.has('d') && g.n < 2) continue;
      if (a.flags.has('u') && g.n > 1) continue;
      ctx.line(a.flags.has('c') ? `${pad(g.n, 7)} ${g.line}` : g.line);
    }
    return code;
  },
};

function parseRanges(spec: string): ((i: number) => boolean) | null {
  const preds: ((i: number) => boolean)[] = [];
  for (const part of spec.split(',')) {
    const m = /^(\d*)(-?)(\d*)$/.exec(part);
    if (!m || (!m[1] && !m[3])) return null;
    const from = m[1] ? Number(m[1]) : 1;
    const to = m[2] ? (m[3] ? Number(m[3]) : Infinity) : from;
    preds.push((i) => i >= from && i <= to);
  }
  return (i) => preds.some((p) => p(i));
}

const cut: Command = {
  name: 'cut',
  man: manual('cut', ['cut -d DELIM -f LIST [FILE]...', 'cut -c LIST [FILE]...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 's', values: 'dfc' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    if (!a.values.f && !a.values.c) return ctx.fail('you must specify a list of bytes, characters, or fields');
    const sel = parseRanges(a.values.f ?? a.values.c);
    if (!sel) return ctx.fail('invalid field value');
    const delim = a.values.d ?? '\t';
    if (a.values.d !== undefined && a.values.d.length !== 1) return ctx.fail('the delimiter must be a single character');
    const { lines, code } = readAllLines(ctx, a.rest);
    for (const l of lines) {
      if (a.values.c) {
        ctx.line([...l].filter((_c, i) => sel(i + 1)).join(''));
      } else if (!l.includes(delim)) {
        if (!a.flags.has('s')) ctx.line(l);
      } else {
        ctx.line(l.split(delim).filter((_p, i) => sel(i + 1)).join(delim));
      }
    }
    return code;
  },
};

function expandTr(set: string): string {
  let out = '';
  const s = set.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\[:(upper|lower|digit|space):\]/g, (_m, c: string) => ({ upper: 'A-Z', lower: 'a-z', digit: '0-9', space: ' \n\t' })[c] ?? '');
  for (let i = 0; i < s.length; i++) {
    if (s[i + 1] === '-' && i + 2 < s.length) {
      const from = s.charCodeAt(i);
      const to = s.charCodeAt(i + 2);
      for (let c = from; c <= to; c++) out += String.fromCharCode(c);
      i += 2;
    } else out += s[i];
  }
  return out;
}

const tr: Command = {
  name: 'tr',
  man: manual('tr', ['tr SET1 SET2', 'tr -d SET1', 'tr -s SET1']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'ds' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    if (!a.rest.length) return ctx.fail('missing operand');
    const input = ctx.stdin ?? '';
    const s1 = expandTr(a.rest[0]);
    if (a.flags.has('d')) {
      ctx.out([...input].filter((c) => !s1.includes(c)).join(''));
      return 0;
    }
    if (a.flags.has('s') && a.rest.length === 1) {
      let out = '';
      for (const c of input) if (!(s1.includes(c) && out[out.length - 1] === c)) out += c;
      ctx.out(out);
      return 0;
    }
    if (a.rest.length < 2) return ctx.fail(`missing operand after '${a.rest[0]}'`);
    const s2 = expandTr(a.rest[1]);
    ctx.out(
      [...input]
        .map((c) => {
          const i = s1.indexOf(c);
          return i < 0 ? c : s2[Math.min(i, s2.length - 1)];
        })
        .join(''),
    );
    return 0;
  },
};

const sed: Command = {
  name: 'sed',
  man: manual('sed', ["sed 's/OLD/NEW/[gi]' [FILE]...", "sed -n 'Np' [FILE]", "sed -n 'A,Bp' [FILE]", "sed '/RE/d' [FILE]"]),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'nE', long: { quiet: 'n' } });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const script = a.rest.shift();
    if (!script) return ctx.fail('no script specified');
    const { lines, code } = readAllLines(ctx, a.rest);
    const quiet = a.flags.has('n');
    const sub = /^s(.)(.*?)\1(.*?)\1([gi]*)$/.exec(script);
    if (sub) {
      let re: RegExp;
      try {
        re = compilePattern(sub[2], { ere: a.flags.has('E'), fixed: false, word: false, icase: sub[4].includes('i'), global: sub[4].includes('g') });
      } catch {
        return ctx.fail('invalid regular expression');
      }
      const repl = sub[3].replace(/\$/g, '$$$$').replace(/\\(\d)/g, '$$$1').replace(/&/g, '$$&');
      for (const l of lines) if (!quiet) ctx.line(l.replace(re, repl));
      return code;
    }
    const range = /^(\d+)(?:,(\d+|\$))?p$/.exec(script);
    if (range) {
      const from = Number(range[1]);
      const to = range[2] === '$' ? lines.length : range[2] ? Number(range[2]) : from;
      lines.forEach((l, i) => {
        const inRange = i + 1 >= from && i + 1 <= to;
        if (inRange) ctx.line(l);
        if (!quiet) ctx.line(l);
      });
      return code;
    }
    const del = /^\/(.*)\/d$/.exec(script);
    if (del) {
      const re = compilePattern(del[1], { ere: a.flags.has('E'), fixed: false, word: false, icase: false });
      for (const l of lines) if (!re.test(l)) ctx.line(l);
      return code;
    }
    return ctx.fail(`unsupported script on this workbench: ${script}`);
  },
};

const awk: Command = {
  name: 'awk',
  man: manual('awk', ["awk [-F SEP] '{print $1, $3}' [FILE]...", "awk [-F SEP] '/RE/ {print $2}' [FILE]...", "awk '$9 == 500 {print $1}' [FILE]..."]),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { values: 'F' });
    if (a.unknown) return ctx.fail(`invalid option ${a.unknown}`, 2);
    const prog = a.rest.shift();
    if (!prog) return ctx.fail('usage: awk [-F SEP] PROGRAM [FILE]...');
    const m = /^\s*(?:\/(.*?)\/|\$(\d+|NF)\s*(==|!=|~|>|<)\s*("?)([^"\s{]*)\4)?\s*(?:\{\s*print\s*(.*?)\s*\})?\s*$/.exec(prog);
    if (!m) return ctx.fail(`unsupported program on this workbench: ${prog}`);
    const { lines, code } = readAllLines(ctx, a.rest);
    const exprs = m[6] ? m[6].split(/\s*,\s*/) : ['$0'];
    let re: RegExp | null = null;
    if (m[1] !== undefined) {
      try {
        re = new RegExp(m[1]);
      } catch {
        return ctx.fail('invalid regular expression');
      }
    }
    for (const l of lines) {
      const fields = a.values.F ? l.split(a.values.F) : l.trim().split(/\s+/);
      const get = (ref: string) => {
        if (ref === '0') return l;
        if (ref === 'NF') return fields[fields.length - 1] ?? '';
        return fields[Number(ref) - 1] ?? '';
      };
      if (re && !re.test(l)) continue;
      if (m[2]) {
        const left = get(m[2]);
        const right = m[5];
        const op = m[3];
        const num = !isNaN(Number(left)) && !isNaN(Number(right));
        const ok = op === '==' ? left === right : op === '!=' ? left !== right : op === '~' ? new RegExp(right).test(left) : op === '>' ? (num ? Number(left) > Number(right) : left > right) : num ? Number(left) < Number(right) : left < right;
        if (!ok) continue;
      }
      ctx.line(
        exprs
          .map((e) => {
            const field = /^\$(\d+|NF)$/.exec(e);
            if (field) return get(field[1]);
            if (e === 'NF') return String(fields.length);
            if (e === 'NR') return String(lines.indexOf(l) + 1);
            return e.replace(/^"|"$/g, '');
          })
          .join(' '),
      );
    }
    return code;
  },
};

const tee: Command = {
  name: 'tee',
  man: manual('tee', ['tee [-a] FILE...']),
  run(ctx) {
    const a = parseArgs(ctx.argv.slice(1), { flags: 'a' });
    const input = ctx.stdin ?? '';
    for (const f of a.rest) {
      try {
        ctx.fs.write(ctx.sh.resolvePath(f), input, ctx.id, { append: a.flags.has('a') });
      } catch (e) {
        ctx.fail(`${f}: ${(e as Error).message}`);
      }
    }
    ctx.out(input);
    return 0;
  },
};

const nl: Command = {
  name: 'nl',
  man: manual('nl', ['nl [FILE]']),
  run(ctx) {
    const { lines, code } = readAllLines(ctx, ctx.argv.slice(1));
    let n = 1;
    for (const l of lines) ctx.line(l.trim() ? `${pad(n++, 6)}\t${l}` : '');
    return code;
  },
};

export const textCommands: Command[] = [cat, echo, less, headTail('head'), headTail('tail'), grep, wc, sort, uniq, cut, tr, sed, awk, tee, nl];
