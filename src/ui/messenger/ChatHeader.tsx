import { useEffect, useMemo, useRef } from 'react';
import { CHARACTERS } from '../../data/characters';
import { presenceOf } from '../../game/presence';
import { tr, trn } from '../../i18n';
import type { ThreadId } from '../../game/types';
import { Avatar } from '../components/Avatar';
import { Icon, IconButton } from '../components/Icon';
import { lastSeenLabel, usernameOf } from '../format';
import { useSession } from '../session';

export function statusLine(s: ReturnType<typeof useSession>, id: ThreadId): string {
  const g = s.engine;
  const c = CHARACTERS[id];
  if (g.isTyping(id) && c.kind !== 'archive') return tr('typing…');
  if (c.kind === 'group') return trn('{n} member', '{n} members', c.members?.length ?? 0);
  if (c.kind === 'archive') return tr(c.tagline);
  const p = presenceOf(c, g.now());
  return p.online ? tr('online') : lastSeenLabel(p.lastSeen, g.now());
}

export function ChatHeader({ thread, onBack, detailsOpen, onDetails, searching, onSearch }: {
  thread: ThreadId;
  onBack: () => void;
  detailsOpen: boolean;
  onDetails: () => void;
  searching: boolean;
  onSearch: () => void;
}) {
  const s = useSession();
  const g = s.engine;
  const c = CHARACTERS[thread];
  const th = g.state.threads[thread];
  const online = c.kind === 'contact' ? presenceOf(c, g.now()).online : undefined;
  const typing = g.isTyping(thread);
  return (
    <header className="chat-header">
      <IconButton icon="back" label={tr('Back to conversations')} className="chat-back" onClick={onBack} />
      <button type="button" className="chat-who" onClick={onDetails} aria-expanded={detailsOpen} aria-label={tr('Details of {name}', { name: tr(c.handle) })}>
        <Avatar id={thread} size={40} online={online} muted={c.kind === 'archive'} />
        <span className="chat-who-text">
          <span className="chat-name">
            {c.kind === 'group' && <Icon name="group" size={15} />}
            <strong>{tr(c.handle)}</strong>
            <code>{usernameOf(thread)}</code>
          </span>
          <span className={typing ? 'chat-status typing-text' : online ? 'chat-status on' : 'chat-status'}>{statusLine(s, thread)}</span>
        </span>
      </button>
      <div className="chat-tools">
        <IconButton icon="search" label={tr('Search in this conversation')} active={searching} onClick={onSearch} />
        <IconButton icon="mute" label={th?.muted ? tr('Turn notifications back on') : tr('Mute notifications')} active={!!th?.muted} onClick={() => g.toggleMuted(thread)} />
        <IconButton icon="info" label={tr('Conversation details')} active={detailsOpen} onClick={onDetails} />
      </div>
    </header>
  );
}

export function ThreadSearch({ thread, query, onQuery, onFocusMessage, onClose }: {
  thread: ThreadId;
  query: string;
  onQuery: (q: string) => void;
  onFocusMessage: (id: number | null) => void;
  onClose: () => void;
}) {
  const s = useSession();
  const input = useRef<HTMLInputElement>(null);
  const messages = s.engine.state.threads[thread]?.messages ?? [];
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) => tr(m.text).toLowerCase().includes(q) || m.attachment?.name.toLowerCase().includes(q)).map((m) => m.id);
  }, [messages, query]);
  const index = useRef(0);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    index.current = hits.length - 1;
    onFocusMessage(hits.at(-1) ?? null);
    // Only when the results change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits.join()]);

  const step = (d: number) => {
    if (!hits.length) return;
    index.current = (index.current + d + hits.length) % hits.length;
    onFocusMessage(hits[index.current]);
  };

  return (
    <div className="thread-search" role="search">
      <Icon name="search" size={16} />
      <input ref={input} value={query} onChange={(e) => onQuery(e.target.value)} placeholder={tr('Search in this conversation')} aria-label={tr('Search in this conversation')} onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? 1 : -1); }
        if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      }} />
      {query.trim() && <span className="thread-search-count" role="status">{hits.length ? tr('{at} of {total}', { at: index.current + 1, total: hits.length }) : tr('No results')}</span>}
      <IconButton icon="up" size={16} label={tr('Previous result')} disabled={hits.length < 2} onClick={() => step(-1)} />
      <IconButton icon="down" size={16} label={tr('Next result')} disabled={hits.length < 2} onClick={() => step(1)} />
      <IconButton icon="close" size={16} label={tr('Close search')} onClick={onClose} />
    </div>
  );
}

/** Pinned messages sit under the header. Clicking one jumps to it; several rotate. */
export function PinnedBanner({ thread, onFocusMessage }: { thread: ThreadId; onFocusMessage: (id: number) => void }) {
  const s = useSession();
  const g = s.engine;
  const th = g.state.threads[thread];
  const pinned = (th?.pinnedMessages ?? []).map((id) => th.messages.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const at = useRef(0);
  if (!pinned.length) return null;
  const current = pinned[at.current % pinned.length] ?? pinned[0];
  return (
    <div className="pinned-banner">
      <Icon name="pin" size={15} />
      <button type="button" className="pinned-text" onClick={() => {
        onFocusMessage(current.id);
        at.current = (at.current + 1) % pinned.length;
      }}>
        <small>{pinned.length > 1 ? tr('Pinned message {at} of {total}', { at: (at.current % pinned.length) + 1, total: pinned.length }) : tr('Pinned message')}</small>
        <span>{current.text ? tr(current.text) : (current.attachment?.name ?? (current.invite ? tr('Assignment') : ''))}</span>
      </button>
      <IconButton icon="close" size={14} label={tr('Unpin this message')} onClick={() => g.togglePinnedMessage(thread, current.id)} />
    </div>
  );
}
