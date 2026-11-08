import type { DbEngine, QuerySet } from '../databases/engine';
import type { FileNode } from '../filesystem/vfs';
import type { CmdCtx, Command, LineProgram } from '../terminal/types';
import { manual } from './manual';

export interface SqlObserver {
  (db: string, sql: string, result: QuerySet): void;
}

type Mode = 'list' | 'column' | 'csv' | 'box';

interface Settings {
  headers: boolean;
  mode: Mode;
}

function render(res: QuerySet, s: Settings): string {
  let out = '';
  for (const set of res.sets) {
    const cell = (v: unknown) => (v === null ? '' : String(v));
    if (s.mode === 'list' || s.mode === 'csv') {
      const sep = s.mode === 'csv' ? ',' : '|';
      const q = (x: string) => (s.mode === 'csv' && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
      if (s.headers) out += set.columns.map(q).join(sep) + '\n';
      for (const row of set.rows) out += row.map((v) => q(cell(v))).join(sep) + '\n';
    } else {
      const widths = set.columns.map((c, i) => Math.max(c.length, ...set.rows.map((r) => cell(r[i]).length), 1));
      const fmt = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd();
      if (s.headers) {
        out += fmt(set.columns) + '\n';
        out += widths.map((w) => '-'.repeat(w)).join('  ') + '\n';
      }
      for (const row of set.rows) out += fmt(row.map(cell)) + '\n';
    }
  }
  return out;
}

async function dotCommand(line: string, dbId: string, engine: DbEngine, s: Settings, observer: SqlObserver | undefined): Promise<{ out: string; quit?: boolean }> {
  const [cmd, ...args] = line.trim().split(/\s+/);
  const q = async (sql: string) => {
    const r = await engine.exec(dbId, sql);
    observer?.(dbId, line, r);
    return r;
  };
  switch (cmd) {
    case '.quit':
    case '.exit':
    case '.q':
      return { out: '', quit: true };
    case '.help':
      return {
        out: [
          '.tables            list tables',
          '.schema [TABLE]    show CREATE statements',
          '.headers on|off    show column names',
          '.mode MODE         list, column, csv',
          '.dbinfo            basic facts about this file',
          '.quit              leave',
          '',
          'Anything else is SQL. End each statement with a semicolon.',
          '',
        ].join('\n'),
      };
    case '.tables': {
      const r = await q(`SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name`);
      const names = r.sets[0]?.rows.map((x) => String(x[0])) ?? [];
      return { out: names.length ? names.join('  ') + '\n' : '' };
    }
    case '.schema': {
      const where = args[0] ? `AND tbl_name='${args[0].replace(/'/g, "''")}'` : '';
      const r = await q(`SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ${where} ORDER BY type DESC, name`);
      return { out: (r.sets[0]?.rows ?? []).map((x) => `${x[0]};`).join('\n') + '\n' };
    }
    case '.headers':
      s.headers = args[0] === 'on';
      return { out: '' };
    case '.mode':
      if (['list', 'column', 'csv'].includes(args[0])) {
        s.mode = args[0] as Mode;
        return { out: '' };
      }
      return { out: 'Error: mode should be one of: column csv list\n' };
    case '.dbinfo':
      return { out: `database: ${dbId}\npage size: 4096\nencoding: UTF-8\nmounted: read-only forensic image\n` };
    default:
      return { out: `Error: unknown command or invalid arguments:  "${cmd.slice(1)}". Enter ".help" for help\n` };
  }
}

const sqlite3: Command = {
  name: 'sqlite3',
  tool: 'db',
  man: manual('sqlite3', ['sqlite3 FILE', 'sqlite3 FILE "SQL"', 'sqlite3 -header -column FILE "SQL"']),
  async run(ctx) {
    const args = ctx.argv.slice(1);
    const s: Settings = { headers: false, mode: 'list' };
    const pos: string[] = [];
    for (const a of args) {
      if (a === '-header' || a === '-headers') s.headers = true;
      else if (a === '-column') s.mode = 'column';
      else if (a === '-csv') s.mode = 'csv';
      else if (a === '-list') s.mode = 'list';
      else if (a === '-readonly') continue;
      else if (a.startsWith('-')) return ctx.fail(`unknown option: ${a}`);
      else pos.push(a);
    }
    const file = pos[0] ?? ':memory:';
    const sql = pos[1];
    const engine = ctx.sh.host.services.db as DbEngine;
    const observer = ctx.sh.host.services.onSql as SqlObserver | undefined;
    const dbId = resolveDb(ctx, file);
    if (typeof dbId === 'object') return ctx.fail(dbId.error);
    if (sql !== undefined || ctx.stdin) {
      const src = sql ?? ctx.stdin ?? '';
      if (src.trim().startsWith('.')) {
        const { out } = await dotCommand(src, dbId, engine, s, observer);
        ctx.out(out);
        return 0;
      }
      const r = await engine.exec(dbId, src);
      observer?.(dbId, src, r);
      if (r.error) {
        ctx.err(`Error: ${r.error}\n`);
        return 1;
      }
      ctx.out(render(r, s));
      return 0;
    }
    if (!ctx.isTty) return 0;
    ctx.line('SQLite version 3.45.1');
    ctx.line('Enter ".help" for usage hints. Evidence images are read-only.');
    let quit = false;
    let buffer = '';
    const prog: LineProgram = {
      prompt: () => (buffer ? '   ...> ' : 'sqlite> '),
      done: () => quit,
      async input(line) {
        if (!buffer && line.trim().startsWith('.')) {
          const r = await dotCommand(line, dbId, engine, s, observer);
          if (r.quit) quit = true;
          return r.out;
        }
        if (!line.trim() && !buffer) return '';
        buffer += (buffer ? '\n' : '') + line;
        if (!/;\s*$/.test(buffer.replace(/--.*$/gm, ''))) return '';
        const src = buffer;
        buffer = '';
        const r = await engine.exec(dbId, src);
        observer?.(dbId, src, r);
        if (r.error) return `Error: ${r.error}\n`;
        return render(r, s);
      },
    };
    ctx.sh.program = prog;
    return 0;
  },
};

function resolveDb(ctx: CmdCtx, file: string): string | { error: string } {
  if (file === ':memory:') return ':memory:';
  const p = ctx.sh.resolvePath(file);
  const n = ctx.fs.lookup(p, ctx.id);
  if (!n) return { error: `Error: unable to open database "${file}": unable to open database file` };
  if (n.k !== 'f') return { error: `Error: unable to open database "${file}": it is a directory` };
  if (!ctx.fs.can(n, ctx.id, 4)) return { error: `Error: unable to open database "${file}": Permission denied` };
  const id = (n as FileNode).db;
  if (!id) return { error: `Error: in prepare, file is not a database (26)` };
  ctx.fs.read(p, ctx.id);
  return id;
}

export const dbCommands: Command[] = [sqlite3];
