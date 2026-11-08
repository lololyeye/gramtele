/**
 * Virtual filesystem. A plain JSON-serialisable tree with POSIX-like semantics:
 * modes, owners, symlinks, and permission checks. Nothing here touches the host.
 *
 * Large deterministic files (generated logs, world documents) are stored as a
 * `ref` into a content registry so saves stay small; the first write replaces
 * the ref with literal data.
 */

export type NodeKind = 'f' | 'd' | 'l';

export interface FileNode {
  k: 'f';
  mode: number;
  uid: number;
  gid: number;
  mtime: number;
  /** Literal content. */
  data?: string;
  /** Content registry key, used when `data` is undefined. */
  ref?: string;
  /** Story evidence tag. Cleared on modification, kept by cp/mv. */
  tag?: string;
  /** Logical database id when the file is an SQLite image. */
  db?: string;
}

export interface DirNode {
  k: 'd';
  mode: number;
  uid: number;
  gid: number;
  mtime: number;
  c: Record<string, VNode>;
}

export interface LinkNode {
  k: 'l';
  mode: number;
  uid: number;
  gid: number;
  mtime: number;
  target: string;
}

export type VNode = FileNode | DirNode | LinkNode;

export interface Identity {
  uid: number;
  gid: number;
  groups: number[];
}

export const ROOT: Identity = { uid: 0, gid: 0, groups: [0] };

export class VfsError extends Error {
  constructor(public code: 'ENOENT' | 'EACCES' | 'ENOTDIR' | 'EISDIR' | 'EEXIST' | 'ENOTEMPTY' | 'EINVAL' | 'ELOOP', message?: string) {
    super(message ?? VfsError.text(code));
  }
  static text(code: VfsError['code']): string {
    switch (code) {
      case 'ENOENT': return 'No such file or directory';
      case 'EACCES': return 'Permission denied';
      case 'ENOTDIR': return 'Not a directory';
      case 'EISDIR': return 'Is a directory';
      case 'EEXIST': return 'File exists';
      case 'ENOTEMPTY': return 'Directory not empty';
      case 'EINVAL': return 'Invalid argument';
      case 'ELOOP': return 'Too many levels of symbolic links';
    }
  }
}

export type ContentResolver = (ref: string) => string;

export interface VfsHooks {
  now: () => number;
  resolve: ContentResolver;
  onRead?: (path: string) => void;
  onChange?: (op: string, path: string) => void;
  /** Shows a stored document in the player's language. The stored text never changes. */
  localize?: (text: string) => string;
}

export function normalize(path: string, cwd = '/'): string {
  const full = path.startsWith('/') ? path : `${cwd}/${path}`;
  const out: string[] = [];
  for (const part of full.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return '/' + out.join('/');
}

export function dirname(path: string): string {
  const n = normalize(path);
  const i = n.lastIndexOf('/');
  return i <= 0 ? '/' : n.slice(0, i);
}

export function basename(path: string): string {
  const n = normalize(path);
  return n === '/' ? '/' : n.slice(n.lastIndexOf('/') + 1);
}

export function modeString(node: VNode): string {
  const t = node.k === 'd' ? 'd' : node.k === 'l' ? 'l' : '-';
  let s = t;
  for (let shift = 6; shift >= 0; shift -= 3) {
    const v = (node.mode >> shift) & 7;
    s += (v & 4 ? 'r' : '-') + (v & 2 ? 'w' : '-') + (v & 1 ? 'x' : '-');
  }
  return s;
}

export class VFS {
  root: DirNode;
  hooks: VfsHooks;

  constructor(hooks: VfsHooks, root?: DirNode) {
    this.hooks = hooks;
    this.root = root ?? { k: 'd', mode: 0o755, uid: 0, gid: 0, mtime: hooks.now(), c: {} };
  }

  // ---------- permissions ----------

  can(node: VNode, id: Identity, want: 4 | 2 | 1): boolean {
    if (id.uid === 0) {
      // root ignores r/w; x requires at least one x bit on files
      if (want !== 1 || node.k === 'd') return true;
      return (node.mode & 0o111) !== 0;
    }
    let shift = 0;
    if (node.uid === id.uid) shift = 6;
    else if (id.groups.includes(node.gid)) shift = 3;
    return ((node.mode >> shift) & want) !== 0;
  }

  // ---------- resolution ----------

  /** Walks a path, following symlinks. Enforces directory search permission. */
  private walk(path: string, id: Identity, followLast: boolean, depth = 0): VNode | null {
    if (depth > 16) throw new VfsError('ELOOP');
    const parts = normalize(path).split('/').filter(Boolean);
    let cur: VNode = this.root;
    let curPath = '';
    for (let i = 0; i < parts.length; i++) {
      if (cur.k !== 'd') throw new VfsError('ENOTDIR');
      if (!this.can(cur, id, 1)) throw new VfsError('EACCES');
      const child: VNode | undefined = cur.c[parts[i]];
      if (!child) return null;
      const isLast = i === parts.length - 1;
      if (child.k === 'l' && (!isLast || followLast)) {
        const rest = parts.slice(i + 1).join('/');
        const target = normalize(child.target, curPath || '/');
        return this.walk(rest ? `${target}/${rest}` : target, id, followLast, depth + 1);
      }
      cur = child;
      curPath += '/' + parts[i];
    }
    return cur;
  }

  lookup(path: string, id: Identity = ROOT, follow = true): VNode | null {
    try {
      return this.walk(path, id, follow);
    } catch (e) {
      if (e instanceof VfsError && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return null;
      throw e;
    }
  }

  /** Like lookup but throws ENOENT. */
  stat(path: string, id: Identity = ROOT, follow = true): VNode {
    const n = this.walk(path, id, follow);
    if (!n) throw new VfsError('ENOENT');
    return n;
  }

  exists(path: string, id: Identity = ROOT): boolean {
    try {
      return !!this.walk(path, id, true);
    } catch {
      return false;
    }
  }

  isDir(path: string, id: Identity = ROOT): boolean {
    try {
      return this.walk(path, id, true)?.k === 'd';
    } catch {
      return false;
    }
  }

  private parentOf(path: string, id: Identity): DirNode {
    const parent = this.walk(dirname(path), id, true);
    if (!parent) throw new VfsError('ENOENT');
    if (parent.k !== 'd') throw new VfsError('ENOTDIR');
    return parent;
  }

  // ---------- reading ----------

  /** The bytes on the virtual disk, whatever language the game is shown in. Hashes use this. */
  rawContent(node: FileNode): string {
    if (node.data !== undefined) return node.data;
    if (node.ref) return this.hooks.resolve(node.ref);
    return '';
  }

  fileContent(node: FileNode): string {
    const raw = this.rawContent(node);
    return this.hooks.localize ? this.hooks.localize(raw) : raw;
  }

  size(node: VNode): number {
    if (node.k === 'd') return 4096;
    if (node.k === 'l') return node.target.length;
    if (node.db) return 1024 * 96;
    return new TextEncoder().encode(this.fileContent(node)).length;
  }

  /** Reads a file as `id`, firing the read hook (missions observe this). */
  read(path: string, id: Identity = ROOT): string {
    const n = this.stat(path, id);
    if (n.k === 'd') throw new VfsError('EISDIR');
    if (n.k === 'l') throw new VfsError('EINVAL');
    if (!this.can(n, id, 4)) throw new VfsError('EACCES');
    this.hooks.onRead?.(normalize(path));
    if (n.db) return dbImagePreview(n.db);
    return this.fileContent(n);
  }

  list(path: string, id: Identity = ROOT): string[] {
    const n = this.stat(path, id);
    if (n.k !== 'd') throw new VfsError('ENOTDIR');
    if (!this.can(n, id, 4)) throw new VfsError('EACCES');
    return Object.keys(n.c).sort(sortNames);
  }

  // ---------- writing ----------

  write(path: string, data: string, id: Identity = ROOT, opts: { append?: boolean; mode?: number } = {}): void {
    const existing = this.walk(path, id, true);
    if (existing) {
      if (existing.k === 'd') throw new VfsError('EISDIR');
      if (existing.k !== 'f') throw new VfsError('EINVAL');
      if (!this.can(existing, id, 2)) throw new VfsError('EACCES');
      const prior = opts.append ? this.rawContent(existing) : '';
      existing.data = prior + data;
      delete existing.ref;
      delete existing.tag;
      delete existing.db;
      existing.mtime = this.hooks.now();
    } else {
      const parent = this.parentOf(path, id);
      if (!this.can(parent, id, 2)) throw new VfsError('EACCES');
      parent.c[basename(path)] = {
        k: 'f',
        mode: opts.mode ?? 0o644,
        uid: id.uid,
        gid: id.gid,
        mtime: this.hooks.now(),
        data,
      };
      parent.mtime = this.hooks.now();
    }
    this.hooks.onChange?.('write', normalize(path));
  }

  touch(path: string, id: Identity = ROOT): void {
    const n = this.walk(path, id, true);
    if (n) {
      if (id.uid !== 0 && n.uid !== id.uid && !this.can(n, id, 2)) throw new VfsError('EACCES');
      n.mtime = this.hooks.now();
    } else {
      this.write(path, '', id);
    }
  }

  mkdir(path: string, id: Identity = ROOT, recursive = false, mode = 0o755): void {
    const target = normalize(path);
    const existing = this.lookup(target, id);
    if (existing) {
      if (recursive && existing.k === 'd') return;
      throw new VfsError('EEXIST');
    }
    if (recursive) {
      const parent = dirname(target);
      if (parent !== target && !this.lookup(parent, id)) this.mkdir(parent, id, true, mode);
    }
    const parent = this.parentOf(target, id);
    if (!this.can(parent, id, 2)) throw new VfsError('EACCES');
    parent.c[basename(target)] = { k: 'd', mode, uid: id.uid, gid: id.gid, mtime: this.hooks.now(), c: {} };
    parent.mtime = this.hooks.now();
    this.hooks.onChange?.('mkdir', target);
  }

  unlink(path: string, id: Identity = ROOT): void {
    const target = normalize(path);
    const parent = this.parentOf(target, id);
    const name = basename(target);
    const n = parent.c[name];
    if (!n) throw new VfsError('ENOENT');
    if (n.k === 'd') throw new VfsError('EISDIR');
    if (!this.can(parent, id, 2)) throw new VfsError('EACCES');
    delete parent.c[name];
    parent.mtime = this.hooks.now();
    this.hooks.onChange?.('rm', target);
  }

  rmdir(path: string, id: Identity = ROOT, recursive = false): void {
    const target = normalize(path);
    if (target === '/') throw new VfsError('EACCES');
    const parent = this.parentOf(target, id);
    const name = basename(target);
    const n = parent.c[name];
    if (!n) throw new VfsError('ENOENT');
    if (n.k !== 'd') throw new VfsError('ENOTDIR');
    if (!this.can(parent, id, 2)) throw new VfsError('EACCES');
    if (!recursive && Object.keys(n.c).length) throw new VfsError('ENOTEMPTY');
    if (recursive) this.assertRemovable(n, id);
    delete parent.c[name];
    parent.mtime = this.hooks.now();
    this.hooks.onChange?.('rm', target);
  }

  private assertRemovable(dir: DirNode, id: Identity): void {
    if (!this.can(dir, id, 2) || !this.can(dir, id, 1)) throw new VfsError('EACCES');
    for (const child of Object.values(dir.c)) if (child.k === 'd') this.assertRemovable(child, id);
  }

  /** Copies a file (keeping evidence tag and db image, as a bit-for-bit copy would). */
  copyFile(src: string, dest: string, id: Identity = ROOT): void {
    const n = this.stat(src, id);
    if (n.k === 'd') throw new VfsError('EISDIR');
    if (n.k !== 'f') throw new VfsError('EINVAL');
    if (!this.can(n, id, 4)) throw new VfsError('EACCES');
    this.hooks.onRead?.(normalize(src));
    this.write(dest, this.rawContent(n), id, { mode: n.mode & 0o777 & ~0o022 });
    const out = this.stat(dest, id) as FileNode;
    if (n.ref) {
      out.ref = n.ref;
      delete out.data;
    }
    if (n.tag) out.tag = n.tag;
    if (n.db) out.db = n.db;
  }

  copyTree(src: string, dest: string, id: Identity = ROOT): void {
    const n = this.stat(src, id);
    if (n.k !== 'd') return this.copyFile(src, dest, id);
    this.mkdir(dest, id, true);
    for (const name of this.list(src, id)) this.copyTree(`${normalize(src)}/${name}`, `${normalize(dest)}/${name}`, id);
  }

  move(src: string, dest: string, id: Identity = ROOT): void {
    const from = normalize(src);
    const to = normalize(dest);
    if (to === from) throw new VfsError('EINVAL', 'are the same file');
    if (to.startsWith(from + '/')) throw new VfsError('EINVAL');
    const srcParent = this.parentOf(from, id);
    const name = basename(from);
    const n = srcParent.c[name];
    if (!n) throw new VfsError('ENOENT');
    if (!this.can(srcParent, id, 2)) throw new VfsError('EACCES');
    const dstParent = this.parentOf(to, id);
    if (!this.can(dstParent, id, 2)) throw new VfsError('EACCES');
    const existing = dstParent.c[basename(to)];
    if (existing?.k === 'd') throw new VfsError('EISDIR');
    delete srcParent.c[name];
    dstParent.c[basename(to)] = n;
    srcParent.mtime = dstParent.mtime = this.hooks.now();
    this.hooks.onChange?.('mv', to);
  }

  chmod(path: string, mode: number, id: Identity = ROOT): void {
    const n = this.stat(path, id);
    if (id.uid !== 0 && n.uid !== id.uid) throw new VfsError('EACCES', 'Operation not permitted');
    n.mode = mode & 0o7777;
    this.hooks.onChange?.('chmod', normalize(path));
  }

  symlink(target: string, path: string, id: Identity = ROOT): void {
    const parent = this.parentOf(path, id);
    if (!this.can(parent, id, 2)) throw new VfsError('EACCES');
    if (parent.c[basename(path)]) throw new VfsError('EEXIST');
    parent.c[basename(path)] = { k: 'l', mode: 0o777, uid: id.uid, gid: id.gid, mtime: this.hooks.now(), target };
  }

  // ---------- traversal ----------

  /** Depth-first walk that silently prunes unreadable dirs but reports them. */
  walkTree(start: string, id: Identity, visit: (path: string, node: VNode) => void, onDenied?: (path: string) => void): void {
    const n = this.stat(start, id, false);
    visit(normalize(start), n);
    if (n.k !== 'd') return;
    if (!this.can(n, id, 4) || !this.can(n, id, 1)) {
      onDenied?.(normalize(start));
      return;
    }
    for (const name of Object.keys(n.c).sort(sortNames)) {
      const child = normalize(start) === '/' ? `/${name}` : `${normalize(start)}/${name}`;
      this.walkTree(child, id, visit, onDenied);
    }
  }

  serialize(): DirNode {
    return this.root;
  }
}

function sortNames(a: string, b: string): number {
  return a.replace(/^\./, '').toLowerCase().localeCompare(b.replace(/^\./, '').toLowerCase());
}

function dbImagePreview(id: string): string {
  // A credible header so `head`, `xxd` and `strings` show what a real image shows.
  return `SQLite format 3\u0000\u0010\u0000\u0001\u0001\u0000@  \u0000\u0000\u0000\u0004\u0000\u0000\u0000\u0018table ${id} image, use sqlite3 to read\n`;
}

// ---------- world-building helper ----------

export interface SeedFile {
  path: string;
  data?: string;
  ref?: string;
  mode?: number;
  uid?: number;
  gid?: number;
  mtime?: number;
  tag?: string;
  db?: string;
}

/** Installs a file as root, creating parents. Used by world seeds and missions. */
export function installFile(fs: VFS, f: SeedFile): void {
  const parent = dirname(f.path);
  fs.mkdir(parent, ROOT, true);
  const hookChange = fs.hooks.onChange;
  fs.hooks.onChange = undefined;
  fs.write(f.path, f.data ?? '', ROOT, { mode: f.mode ?? 0o644 });
  fs.hooks.onChange = hookChange;
  const node = fs.stat(f.path) as FileNode;
  node.uid = f.uid ?? 0;
  node.gid = f.gid ?? f.uid ?? 0;
  if (f.mtime) node.mtime = f.mtime;
  if (f.ref) {
    node.ref = f.ref;
    delete node.data;
  }
  if (f.tag) node.tag = f.tag;
  if (f.db) node.db = f.db;
}
