/**
 * Bash-subset parser. Splits raw input into a command list:
 *   list     := pipeline ((';' | '&&' | '||') pipeline)*
 *   pipeline := simple ('|' simple)*
 *   simple   := assignment* word* redirection*
 * Quoting, $VAR, $?, ${VAR}, $(cmd), ~ and globs are resolved at expansion time.
 */

export type Part =
  | { t: 'lit'; v: string; quoted: boolean }
  | { t: 'var'; name: string; quoted: boolean }
  | { t: 'sub'; src: string; quoted: boolean };

export type Word = Part[];

export interface Redirect {
  fd: 1 | 2 | 0;
  op: '>' | '>>' | '<' | '>&';
  target: Word;
}

export interface SimpleCommand {
  assigns: { name: string; value: Word }[];
  words: Word[];
  redirects: Redirect[];
}

export interface Pipeline {
  commands: SimpleCommand[];
}

export interface ListItem {
  pipeline: Pipeline;
  /** Operator linking this item to the *previous* one. */
  link: ';' | '&&' | '||' | null;
}

export class ParseError extends Error {}

type Tok =
  | { k: 'word'; word: Word }
  | { k: 'op'; v: '|' | ';' | '&&' | '||' }
  | { k: 'redir'; fd: 0 | 1 | 2; op: Redirect['op'] };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;

  const readVar = (parts: Part[], quoted: boolean): void => {
    // src[i] === '$'
    const next = src[i + 1];
    if (next === '(') {
      let depth = 1;
      let j = i + 2;
      while (j < n && depth > 0) {
        if (src[j] === '(') depth++;
        else if (src[j] === ')') depth--;
        j++;
      }
      if (depth !== 0) throw new ParseError("syntax error: unexpected end of file while looking for matching ')'");
      parts.push({ t: 'sub', src: src.slice(i + 2, j - 1), quoted });
      i = j;
      return;
    }
    if (next === '{') {
      const end = src.indexOf('}', i);
      if (end < 0) throw new ParseError("syntax error: bad substitution");
      parts.push({ t: 'var', name: src.slice(i + 2, end), quoted });
      i = end + 1;
      return;
    }
    if (next === '?' || next === '$' || next === '#') {
      parts.push({ t: 'var', name: next, quoted });
      i += 2;
      return;
    }
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1));
    if (m) {
      parts.push({ t: 'var', name: m[0], quoted });
      i += 1 + m[0].length;
      return;
    }
    parts.push({ t: 'lit', v: '$', quoted });
    i++;
  };

  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c === '#') break;
    if (c === '|') {
      if (src[i + 1] === '|') {
        toks.push({ k: 'op', v: '||' });
        i += 2;
      } else {
        toks.push({ k: 'op', v: '|' });
        i++;
      }
      continue;
    }
    if (c === '&' && src[i + 1] === '&') {
      toks.push({ k: 'op', v: '&&' });
      i += 2;
      continue;
    }
    if (c === '&') throw new ParseError('background jobs (&) are not supported on this workbench');
    if (c === ';') {
      toks.push({ k: 'op', v: ';' });
      i++;
      continue;
    }
    // redirections, optionally with a leading fd digit
    const fdMatch = /^([012])?(>>|>&|>|<)/.exec(src.slice(i));
    if (fdMatch && (fdMatch[1] === undefined || /[>< ]/.test(src[i + 1] ?? ''))) {
      const fd = (fdMatch[1] ? Number(fdMatch[1]) : fdMatch[2] === '<' ? 0 : 1) as 0 | 1 | 2;
      toks.push({ k: 'redir', fd, op: fdMatch[2] as Redirect['op'] });
      i += fdMatch[0].length;
      continue;
    }
    // word
    const parts: Part[] = [];
    let lit = '';
    const flush = (quoted: boolean) => {
      if (lit) parts.push({ t: 'lit', v: lit, quoted });
      lit = '';
    };
    let sawQuote = false;
    while (i < n) {
      const ch = src[i];
      if (/[\s|;&<>]/.test(ch)) break;
      if (ch === '\\') {
        flush(false);
        if (i + 1 < n) parts.push({ t: 'lit', v: src[i + 1], quoted: true });
        i += 2;
        continue;
      }
      if (ch === "'") {
        flush(false);
        sawQuote = true;
        const end = src.indexOf("'", i + 1);
        if (end < 0) throw new ParseError("syntax error: unexpected EOF while looking for matching `''");
        parts.push({ t: 'lit', v: src.slice(i + 1, end), quoted: true });
        i = end + 1;
        continue;
      }
      if (ch === '"') {
        flush(false);
        sawQuote = true;
        i++;
        let q = '';
        let closed = false;
        while (i < n) {
          const d = src[i];
          if (d === '"') {
            closed = true;
            i++;
            break;
          }
          if (d === '\\' && i + 1 < n && '"\\$`'.includes(src[i + 1])) {
            q += src[i + 1];
            i += 2;
            continue;
          }
          if (d === '$') {
            if (q) parts.push({ t: 'lit', v: q, quoted: true });
            q = '';
            readVar(parts, true);
            continue;
          }
          q += d;
          i++;
        }
        if (!closed) throw new ParseError('syntax error: unexpected EOF while looking for matching `"\'');
        if (q) parts.push({ t: 'lit', v: q, quoted: true });
        continue;
      }
      if (ch === '$') {
        flush(false);
        readVar(parts, false);
        continue;
      }
      lit += ch;
      i++;
    }
    flush(false);
    if (parts.length === 0 && sawQuote) parts.push({ t: 'lit', v: '', quoted: true });
    toks.push({ k: 'word', word: parts });
  }
  return toks;
}

export function parse(src: string): ListItem[] {
  const toks = tokenize(src);
  const items: ListItem[] = [];
  let link: ListItem['link'] = null;
  let commands: SimpleCommand[] = [];
  let cur: SimpleCommand = { assigns: [], words: [], redirects: [] };

  const endCommand = (op: string) => {
    if (!cur.words.length && !cur.assigns.length && !cur.redirects.length) {
      throw new ParseError(`syntax error near unexpected token \`${op}'`);
    }
    commands.push(cur);
    cur = { assigns: [], words: [], redirects: [] };
  };

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.k === 'word') {
      const first = t.word[0];
      const assign = cur.words.length === 0 && first?.t === 'lit' && !first.quoted ? /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s.exec(first.v) : null;
      if (assign) {
        const value: Word = [{ t: 'lit', v: assign[2], quoted: true }, ...t.word.slice(1)];
        cur.assigns.push({ name: assign[1], value });
      } else {
        cur.words.push(t.word);
      }
    } else if (t.k === 'redir') {
      const next = toks[++i];
      if (!next || next.k !== 'word') throw new ParseError("syntax error near unexpected token `newline'");
      cur.redirects.push({ fd: t.fd, op: t.op, target: next.word });
    } else if (t.v === '|') {
      endCommand('|');
      if (i === toks.length - 1) throw new ParseError("syntax error: unexpected end of file after `|'");
    } else {
      // list operator
      if (cur.words.length || cur.assigns.length || cur.redirects.length) endCommand(t.v);
      else if (t.v !== ';' || commands.length === 0) throw new ParseError(`syntax error near unexpected token \`${t.v}'`);
      items.push({ pipeline: { commands }, link });
      commands = [];
      link = t.v as ListItem['link'];
      if (t.v !== ';' && i === toks.length - 1) throw new ParseError('syntax error: unexpected end of file');
    }
  }
  if (cur.words.length || cur.assigns.length || cur.redirects.length) commands.push(cur);
  if (commands.length) items.push({ pipeline: { commands }, link });
  return items;
}

/** Glob pattern to RegExp. Supports * ? and [..]. */
export function globToRegExp(glob: string): RegExp {
  let re = '^';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const end = glob.indexOf(']', i + 1);
      if (end < 0) re += '\\[';
      else {
        let body = glob.slice(i + 1, end);
        if (body.startsWith('!')) body = '^' + body.slice(1);
        re += `[${body.replace(/\\/g, '\\\\')}]`;
        i = end;
      }
    } else re += c.replace(/[.+^${}()|\\\]]/g, '\\$&');
  }
  return new RegExp(re + '$');
}
