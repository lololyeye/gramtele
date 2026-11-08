import type { FileNode } from '../filesystem/vfs';
import { tr, trn } from '../../i18n';
import type { CmdCtx, Command } from '../terminal/types';
import { splitLines } from './args';
import { sha256 } from './forensic';

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
  man: {
    name: 'show the active assignment',
    synopsis: ['mission'],
    description: 'Prints the active mission and the state of its objectives. The same information as the Missions panel, without leaving the keyboard.',
  },
  run(ctx) {
    for (const l of api(ctx).missionStatus()) ctx.line(l);
    return 0;
  },
};

const submit: Command = {
  name: 'submit',
  man: {
    name: 'file a finding against the active assignment',
    synopsis: ['submit', 'submit KEY VALUE...'],
    description: 'With no arguments, lists what the assignment still needs answered. With a key and a value, files a finding. Wrong answers cost nothing but are recorded in your post-mission review. Reason first, then file.',
    examples: [['submit', 'what is outstanding?'], ['submit uid 1000', 'file a finding']],
  },
  run(ctx) {
    const [key, ...rest] = ctx.argv.slice(1);
    const a = api(ctx);
    if (!key) {
      const open = a.openAnswers();
      if (!open.length) {
        ctx.line(tr('Nothing outstanding on this assignment.'));
        return 0;
      }
      ctx.line(tr('Outstanding findings:'));
      for (const o of open) ctx.line(`  ${o.key.padEnd(18)} ${o.prompt}`);
      ctx.line('');
      ctx.line(tr('File with: submit KEY VALUE'));
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
  man: {
    name: 'ask for the next hint on an objective',
    synopsis: ['hint [N]'],
    description: 'Reveals the next level of hint for the first open objective, or for objective N. Hints start vague and get specific. Using them reduces the bonus for that objective a little, and nothing else. Being stuck is normal.',
  },
  run(ctx) {
    const n = ctx.argv[1] ? Number(ctx.argv[1]) - 1 : undefined;
    ctx.line(api(ctx).hint(n));
    return 0;
  },
};

const evidence: Command = {
  name: 'evidence',
  man: {
    name: 'manage your evidence locker',
    synopsis: ['evidence add FILE', 'evidence list', 'evidence verify FILE'],
    description: 'Registers a file in your locker with a SHA-256 hash taken at the moment of collection, the way chain of custody works. "verify" recomputes a file\'s hash against the locker. Editing a file breaks its link to the original: collect first, annotate copies.',
    examples: [['evidence add ~/Downloads/ridge_0412.jpg', 'collect and hash a file'], ['evidence list', 'what do I have?']],
    why: 'Evidence nobody can verify is only a story. Hash at collection, record the source, work on copies.',
  },
  run(ctx) {
    const [sub, file] = ctx.argv.slice(1);
    const a = api(ctx);
    if (!sub || sub === 'list') {
      const rows = a.evidenceRows();
      if (!rows.length) {
        ctx.line(tr('Locker is empty. Use: evidence add FILE'));
        return 0;
      }
      for (const r of rows) ctx.line(`${r.id.padEnd(22)} ${(r.hash ?? '-').slice(0, 16).padEnd(17)} ${r.title}`);
      return 0;
    }
    if (sub === 'add') {
      if (!file) return ctx.fail('usage: evidence add FILE');
      const p = ctx.sh.resolvePath(file);
      const n = ctx.fs.stat(p, ctx.id);
      if (n.k !== 'f') return ctx.fail(tr('{file}: not a regular file', { file }));
      ctx.fs.read(p, ctx.id);
      const hash = sha256(ctx.fs.rawContent(n as FileNode));
      const res = a.collectEvidence((n as FileNode).tag, p, hash);
      ctx.line(res.added ? `${tr('Collected: {title}', { title: res.title })}\nsha256 ${hash}` : `${res.title}\nsha256 ${hash}`);
      return 0;
    }
    if (sub === 'verify') {
      if (!file) return ctx.fail('usage: evidence verify FILE');
      const p = ctx.sh.resolvePath(file);
      const n = ctx.fs.stat(p, ctx.id);
      if (n.k !== 'f') return ctx.fail(tr('{file}: not a regular file', { file }));
      ctx.fs.read(p, ctx.id);
      const hash = sha256(ctx.fs.rawContent(n as FileNode));
      const row = a.evidenceRows().find((x) => x.hash === hash);
      if (row) {
        ctx.line(tr('{file}: OK, matches locker entry "{title}"', { file, title: row.title }));
        return 0;
      }
      ctx.line(tr("{file}: NO MATCH. This file's content is not in your locker.", { file }));
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
  man: {
    name: 'assemble a verifiable dossier',
    synopsis: ['dossier status', 'dossier seal'],
    description: 'Works on the directory ~/dossier. "status" checks each required exhibit by content tag, so renaming a file is fine but editing it is not. "seal" writes ~/dossier.tar with a hash manifest. An archive will not read anything it cannot verify.',
    examples: [['mkdir ~/dossier && cp evidence.db ~/dossier/', 'build it with ordinary file commands'], ['dossier status', 'what is still missing?']],
  },
  run(ctx) {
    const sub = ctx.argv[1] ?? 'status';
    const a = api(ctx);
    const files = dossierFiles(ctx);
    const present = new Map(files.filter((f) => f.node.tag).map((f) => [f.node.tag!, f.path]));
    const required = a.dossierRequired();
    if (sub === 'status') {
      ctx.line(`~/dossier: ${trn('{n} file', '{n} files', files.length)}`);
      for (const r of required) {
        const hit = present.get(r.tag);
        ctx.line(`  [${hit ? 'x' : ' '}] ${r.title}${hit ? `  (${hit.split('/').pop()})` : ''}`);
      }
      const untagged = files.filter((f) => !f.node.tag);
      if (untagged.length) ctx.line(`  ${tr('note: {n} file(s) carry no exhibit tag: edited copies, or your own notes. They travel, but prove nothing.', { n: untagged.length })}`);
      return 0;
    }
    if (sub === 'seal') {
      const missing = required.filter((r) => !present.has(r.tag));
      if (missing.length) {
        ctx.line(trn('Cannot seal. Missing {n} exhibit:', 'Cannot seal. Missing {n} exhibits:', missing.length));
        for (const m of missing) ctx.line(`  - ${m.title}`);
        return 1;
      }
      const lines = files.map((f) => `${sha256(ctx.fs.rawContent(f.node))}  ${f.path.split('/').pop()}`);
      const body = `GTDOSSIER\nverified=true\nexhibits=${required.length}\n${lines.join('\n')}\n`;
      ctx.fs.write(ctx.sh.resolvePath('~/dossier.tar'), body, ctx.id);
      a.markSealed([...present.keys()]);
      ctx.line(tr('Sealed ~/dossier.tar ({files} files, {exhibits} exhibits verified).', { files: files.length, exhibits: required.length }));
      return 0;
    }
    return ctx.fail(`unknown subcommand: ${sub}`);
  },
};

const note: Command = {
  name: 'note',
  man: {
    name: 'add a line to your journal',
    synopsis: ['note TEXT...'],
    description: 'Appends a timestamped line to your investigation journal. A finding you cannot reproduce from your own notes is a rumour.',
  },
  run(ctx) {
    const t = ctx.argv.slice(1).join(' ');
    if (!t) return ctx.fail('usage: note TEXT...');
    api(ctx).addNote(t);
    ctx.line(tr('Noted.'));
    return 0;
  },
};

const diff: Command = {
  name: 'diff',
  tool: 'forensics',
  man: {
    name: 'compare two files line by line',
    synopsis: ['diff FILE1 FILE2'],
    description: 'Shows the lines that differ. "<" lines exist only in the first file, ">" lines only in the second. No output and exit status 0 means the files are identical.',
    examples: [['diff auth.log rotated/auth.log.1', 'what changed between these two copies?']],
    why: 'A hash tells you that something changed. diff tells you what.',
  },
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
