import type { FileNode } from '../filesystem/vfs';
import { T, Tn } from '../../i18n';
import type { CmdCtx, Command } from '../terminal/types';
import { splitLines } from './args';
import { sha256 } from './forensic';
import { manual } from './manual';

/** The narrow surface the in-world case tools use to reach the game layer. */
export interface GameApi {
  missionStatus(): string[];
  submit(key: string, value: string): { known: boolean; ok: boolean; message: string };
  openAnswers(): { key: string; prompt: string }[];
  hint(objectiveIndex?: number): string;
  collectEvidence(tag: string | undefined, path: string, hash: string): { added: boolean; title: string };
  evidenceRows(): { id: string; title: string; hash: string | null; source: string }[];
  addNote(text: string): void;
  dossierRequired(): { tag: string; title: string }[];
  markSealed(tags: string[]): void;
}

function api(ctx: CmdCtx): GameApi {
  return ctx.sh.host.services.game as GameApi;
}

const mission: Command = {
  name: 'mission',
  man: manual('mission', ['mission']),
  run(ctx) {
    for (const l of api(ctx).missionStatus()) ctx.line(l);
    return 0;
  },
};

const submit: Command = {
  name: 'submit',
  man: manual('submit', ['submit', 'submit KEY VALUE...']),
  run(ctx) {
    const [key, ...rest] = ctx.argv.slice(1);
    const a = api(ctx);
    if (!key) {
      const open = a.openAnswers();
      if (!open.length) {
        ctx.line(T('nothing_outstanding_on_this_assignment'));
        return 0;
      }
      ctx.line(T('outstanding_findings'));
      for (const o of open) ctx.line(`  ${o.key.padEnd(18)} ${o.prompt}`);
      ctx.line('');
      ctx.line(T('file_with_submit_key_value'));
      return 0;
    }
    if (!rest.length) return ctx.fail(`usage: submit ${key} VALUE`);
    const r = a.submit(key, rest.join(' '));
    ctx.line(r.message);
    return r.ok ? 0 : 1;
  },
};

const hint: Command = {
  name: 'hint',
  man: manual('hint', ['hint [N]']),
  run(ctx) {
    const n = ctx.argv[1] ? Number(ctx.argv[1]) - 1 : undefined;
    ctx.line(api(ctx).hint(n));
    return 0;
  },
};

const evidence: Command = {
  name: 'evidence',
  man: manual('evidence', ['evidence add FILE', 'evidence list', 'evidence verify FILE']),
  run(ctx) {
    const [sub, file] = ctx.argv.slice(1);
    const a = api(ctx);
    if (!sub || sub === 'list') {
      const rows = a.evidenceRows();
      if (!rows.length) {
        ctx.line(T('locker_is_empty_use_evidence'));
        return 0;
      }
      for (const r of rows) ctx.line(`${r.id.padEnd(22)} ${(r.hash ?? '-').slice(0, 16).padEnd(17)} ${r.title}`);
      return 0;
    }
    if (sub === 'add') {
      if (!file) return ctx.fail('usage: evidence add FILE');
      const p = ctx.sh.resolvePath(file);
      const n = ctx.fs.stat(p, ctx.id);
      if (n.k !== 'f') return ctx.fail(T('file_not_a_regular_file', { file }));
      ctx.fs.read(p, ctx.id);
      const hash = sha256(ctx.fs.rawContent(n as FileNode));
      const res = a.collectEvidence((n as FileNode).tag, p, hash);
      ctx.line(res.added ? `${T('collected_title', { title: res.title })}\nsha256 ${hash}` : `${res.title}\nsha256 ${hash}`);
      return 0;
    }
    if (sub === 'verify') {
      if (!file) return ctx.fail('usage: evidence verify FILE');
      const p = ctx.sh.resolvePath(file);
      const n = ctx.fs.stat(p, ctx.id);
      if (n.k !== 'f') return ctx.fail(T('file_not_a_regular_file', { file }));
      ctx.fs.read(p, ctx.id);
      const hash = sha256(ctx.fs.rawContent(n as FileNode));
      const row = a.evidenceRows().find((x) => x.hash === hash);
      if (row) {
        ctx.line(T('file_ok_matches_locker_entry', { file, title: row.title }));
        return 0;
      }
      ctx.line(T('file_no_match_this_file', { file }));
      return 1;
    }
    return ctx.fail(`unknown subcommand: ${sub}`);
  },
};

function dossierFiles(ctx: CmdCtx): { path: string; node: FileNode }[] {
  const root = ctx.sh.resolvePath('~/dossier');
  const out: { path: string; node: FileNode }[] = [];
  if (!ctx.fs.isDir(root, ctx.id)) return out;
  ctx.fs.walkTree(root, ctx.id, (path, n) => {
    if (n.k === 'f') out.push({ path, node: n });
  });
  return out;
}

const dossier: Command = {
  name: 'dossier',
  tool: 'dossier',
  man: manual('dossier', ['dossier status', 'dossier seal']),
  run(ctx) {
    const sub = ctx.argv[1] ?? 'status';
    const a = api(ctx);
    const files = dossierFiles(ctx);
    const present = new Map(files.filter((f) => f.node.tag).map((f) => [f.node.tag!, f.path]));
    const required = a.dossierRequired();
    if (sub === 'status') {
      ctx.line(`~/dossier: ${Tn('n_file', 'n_files', files.length)}`);
      for (const r of required) {
        const hit = present.get(r.tag);
        ctx.line(`  [${hit ? 'x' : ' '}] ${r.title}${hit ? `  (${hit.split('/').pop()})` : ''}`);
      }
      const untagged = files.filter((f) => !f.node.tag);
      if (untagged.length) ctx.line(`  ${T('note_n_file_s_carry', { n: untagged.length })}`);
      return 0;
    }
    if (sub === 'seal') {
      const missing = required.filter((r) => !present.has(r.tag));
      if (missing.length) {
        ctx.line(Tn('cannot_seal_missing_n_exhibit', 'cannot_seal_missing_n_exhibits', missing.length));
        for (const m of missing) ctx.line(`  - ${m.title}`);
        return 1;
      }
      const lines = files.map((f) => `${sha256(ctx.fs.rawContent(f.node))}  ${f.path.split('/').pop()}`);
      const body = `GTDOSSIER\nverified=true\nexhibits=${required.length}\n${lines.join('\n')}\n`;
      ctx.fs.write(ctx.sh.resolvePath('~/dossier.tar'), body, ctx.id);
      a.markSealed([...present.keys()]);
      ctx.line(T('sealed_dossier_tar_files_files', { files: files.length, exhibits: required.length }));
      return 0;
    }
    return ctx.fail(`unknown subcommand: ${sub}`);
  },
};

const note: Command = {
  name: 'note',
  man: manual('note', ['note TEXT...']),
  run(ctx) {
    const t = ctx.argv.slice(1).join(' ');
    if (!t) return ctx.fail('usage: note TEXT...');
    api(ctx).addNote(t);
    ctx.line(T('noted'));
    return 0;
  },
};

const diff: Command = {
  name: 'diff',
  tool: 'forensics',
  man: manual('diff', ['diff FILE1 FILE2']),
  run(ctx) {
    const args = ctx.argv.slice(1).filter((s) => !s.startsWith('-'));
    if (args.length !== 2) return ctx.fail('usage: diff FILE1 FILE2', 2);
    let a: string[];
    let b: string[];
    try {
      a = splitLines(ctx.fs.read(ctx.sh.resolvePath(args[0]), ctx.id));
      b = splitLines(ctx.fs.read(ctx.sh.resolvePath(args[1]), ctx.id));
    } catch (e) {
      return ctx.fail((e as Error).message, 2);
    }
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;
    let endA = a.length;
    let endB = b.length;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
      endA--;
      endB--;
    }
    if (start === endA && start === endB) return 0;
    const midA = a.slice(start, endA);
    const midB = b.slice(start, endB);
    // Multiset walk: keeps output sensible for scattered edits without quadratic cost on large logs.
    const inB = new Map<string, number>();
    for (const l of midB) inB.set(l, (inB.get(l) ?? 0) + 1);
    const inA = new Map<string, number>();
    for (const l of midA) inA.set(l, (inA.get(l) ?? 0) + 1);
    let changed = false;
    midA.forEach((l, i) => {
      const n = inB.get(l) ?? 0;
      if (n > 0) inB.set(l, n - 1);
      else {
        ctx.line(`${start + i + 1}d`);
        ctx.line(`< ${l}`);
        changed = true;
      }
    });
    midB.forEach((l, i) => {
      const n = inA.get(l) ?? 0;
      if (n > 0) inA.set(l, n - 1);
      else {
        ctx.line(`${start + i + 1}a`);
        ctx.line(`> ${l}`);
        changed = true;
      }
    });
    return changed ? 1 : 0;
  },
};

export const gameCommands: Command[] = [mission, submit, hint, evidence, dossier, note, diff];
