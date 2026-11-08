/**
 * Real SQLite (compiled to WebAssembly) for the database missions and the
 * vulnerable portal. Loaded lazily, so the first paint stays fast. Each database
 * is an in-memory instance built from a deterministic seed script.
 */
import type { Database, SqlJsStatic } from 'sql.js';

export interface QueryResult {
  columns: string[];
  rows: (string | number | null)[][];
  error?: string;
}

export interface QuerySet {
  sets: QueryResult[];
  error?: string;
}

export class DbEngine {
  private sql: SqlJsStatic | null = null;
  private loading: Promise<SqlJsStatic> | null = null;
  private dbs = new Map<string, Database>();

  constructor(
    private seeds: Record<string, string | (() => string)>,
    /** Databases the app itself can write to (the portal's session tables). */
    private writable: Set<string> = new Set(),
  ) {}

  private load(): Promise<SqlJsStatic> {
    if (this.sql) return Promise.resolve(this.sql);
    this.loading ??= (async () => {
      const mod = await import('sql.js');
      const init = (mod.default ?? mod) as unknown as (cfg?: object) => Promise<SqlJsStatic>;
      let cfg: object | undefined;
      if (typeof window !== 'undefined') {
        const wasm = await import('sql.js/dist/sql-wasm.wasm?url');
        cfg = { locateFile: () => wasm.default };
      }
      this.sql = await init(cfg);
      return this.sql;
    })();
    return this.loading;
  }

  async open(id: string): Promise<Database> {
    const existing = this.dbs.get(id);
    if (existing) return existing;
    const SQL = await this.load();
    const db = new SQL.Database();
    if (id !== ':memory:') {
      const seed = this.seeds[id];
      if (seed === undefined) throw new Error(`unknown database ${id}`);
      db.run(typeof seed === 'function' ? seed() : seed);
      if (!this.writable.has(id)) db.run('PRAGMA query_only = ON;');
    }
    this.dbs.set(id, db);
    return db;
  }

  /** Runs every statement in `sql`, returning one result per row-producing statement. */
  async exec(id: string, sql: string): Promise<QuerySet> {
    let db: Database;
    try {
      db = await this.open(id);
    } catch (e) {
      return { sets: [], error: (e as Error).message };
    }
    try {
      const res = db.exec(sql);
      return { sets: res.map((r) => ({ columns: r.columns, rows: r.values as (string | number | null)[][] })) };
    } catch (e) {
      const msg = (e as Error).message;
      return { sets: [], error: msg };
    }
  }

  /** Convenience for site handlers: first result set only. */
  async query(id: string, sql: string): Promise<QueryResult> {
    const r = await this.exec(id, sql);
    if (r.error) return { columns: [], rows: [], error: r.error };
    return r.sets[0] ?? { columns: [], rows: [] };
  }

  close(id: string): void {
    this.dbs.get(id)?.close();
    this.dbs.delete(id);
  }
}
