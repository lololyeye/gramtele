import { useMemo, useState } from 'react';
import { CHARACTERS, THREAD_ORDER } from '../../data/characters';
import { presenceOf } from '../../game/presence';
import { tr, T, Tn } from '../../i18n';
import type { ChatMessage, ThreadId } from '../../game/types';
import { Avatar } from '../components/Avatar';
import { Icon, IconButton } from '../components/Icon';
import { listStamp, senderName, usernameOf } from '../format';
import { useSession } from '../session';
import { MissionCard } from './MissionCard';

function preview(m: ChatMessage | undefined, id: ThreadId): string {
  if (!m) return tr(CHARACTERS[id].tagline);
  if (m.invite && !m.text) return T('assignment');
  return m.text ? tr(m.text) : (m.attachment?.name ?? '');
}

function Row({ id, active, onOpen, index }: { id: ThreadId; active: boolean; onOpen: () => void; index: number }) {
  const s = useSession();
  const g = s.engine;
  const c = CHARACTERS[id];
  const t = g.state.threads[id];
  const last = t.messages.at(-1);
  const typing = g.isTyping(id) && c.kind !== 'archive';
  const draft = !active && s.drafts[id]?.trim();
  const waiting = !!g.choicesFor(id)?.choices.length;
  const online = c.kind === 'contact' ? presenceOf(c, g.now()).online : undefined;
  const who = last?.from === 'me' ? T('you_2') : c.kind === 'group' && last && last.from !== 'sys' ? senderName(last.from) : null;
  return (
    <li style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}>
      <button type="button" className={active ? 'conv active' : 'conv'} aria-current={active} onClick={onOpen}>
        <Avatar id={id} size={46} online={online} muted={c.kind === 'archive'} />
        <span className="conv-main">
          <span className="conv-line">
            <span className="conv-name">
              {c.kind === 'group' && <Icon name="group" size={14} />}
              <strong>{tr(c.handle)}</strong>
              {t.muted && <span className="conv-flag" title={T('muted')}><Icon name="mute" size={13} /></span>}
            </span>
            {last && <time>{listStamp(last.at, g.now())}</time>}
          </span>
          <span className="conv-line">
            <span className="conv-preview">
              {typing ? <em>{T('typing_2')}</em> : draft ? <><b className="draft">{T('draft')}</b> {draft}</> : <>{who && <b>{who}: </b>}{preview(last, id)}</>}
            </span>
            <span className="conv-side">
              {t.pinned && <span className="conv-flag" title={T('pinned')}><Icon name="pin" size={13} /></span>}
              {t.unread > 0
                ? <span key={t.unread} className={t.muted ? 'badge quiet' : 'badge'} aria-label={Tn('n_unread_message', 'n_unread_messages', t.unread)}>{t.unread}</span>
                : waiting && <span className="awaiting" title={T('waiting_for_your_answer')} role="img" aria-label={T('waiting_for_your_answer')} />}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

interface Hit {
  thread: ThreadId;
  message: ChatMessage;
  text: string;
}

export function ConversationList({ active, onOpen }: { active: ThreadId; onOpen: (id: ThreadId, messageId?: number) => void }) {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const [query, setQuery] = useState('');
  const [archived, setArchived] = useState(false);
  const q = query.trim().toLowerCase();

  const visible = THREAD_ORDER.filter((id) => st.threads[id]?.visible);
  const archivedCount = visible.filter((id) => st.threads[id].archived).length;

  const lastAt = (id: ThreadId) => st.threads[id].messages.at(-1)?.at ?? 0;
  const ordered = visible
    .filter((id) => !!st.threads[id].archived === archived)
    .filter((id) => !q || tr(CHARACTERS[id].handle).toLowerCase().includes(q) || usernameOf(id).includes(q))
    .sort((a, b) => Number(!!st.threads[b].pinned) - Number(!!st.threads[a].pinned) || lastAt(b) - lastAt(a));

  const hits = useMemo<Hit[]>(() => {
    if (q.length < 2) return [];
    return visible.flatMap((thread) => st.threads[thread].messages.flatMap((message) => {
      const text = message.text ? tr(message.text) : (message.attachment?.name ?? '');
      return text.toLowerCase().includes(q) ? [{ thread, message, text }] : [];
    })).reverse().slice(0, 30);
    // Message count stands in for the thread contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, visible.length, visible.map((v) => st.threads[v].messages.length).join()]);

  const m = g.activeMissionDef();

  return (
    <nav className="conv-column" aria-label={T('conversations')}>
      <header className="conv-head">
        <div className="conv-title">
          {archived && <IconButton icon="back" size={18} label={T('back_to_conversations')} onClick={() => setArchived(false)} />}
          <h1>{archived ? T('archived') : T('conversations')}</h1>
        </div>
        <label className="conv-search">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={T('search_people_and_messages')} aria-label={T('search_people_and_messages')} onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }} />
          {query && <IconButton icon="close" size={14} label={T('clear_search')} onClick={() => setQuery('')} />}
        </label>
      </header>
      <div className="conv-scroll">
        <ul className="conv-list">
          {ordered.map((id, i) => <Row key={id} id={id} index={i} active={id === active} onOpen={() => onOpen(id)} />)}
          {!ordered.length && !hits.length && <li className="empty-line">{q ? T('nobody_by_that_name') : T('nothing_here')}</li>}
        </ul>
        {hits.length > 0 && (
          <section className="conv-hits">
            <h2>{T('in_messages')}</h2>
            <ul>
              {hits.map((h) => (
                <li key={h.message.id}>
                  <button type="button" className="conv hit" onClick={() => onOpen(h.thread, h.message.id)}>
                    <Avatar id={h.thread} size={36} />
                    <span className="conv-main">
                      <span className="conv-line"><strong>{tr(CHARACTERS[h.thread].handle)}</strong><time>{listStamp(h.message.at, g.now())}</time></span>
                      <span className="conv-preview">{h.text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {!archived && archivedCount > 0 && !q && (
          <button type="button" className="conv-archive" onClick={() => setArchived(true)}>
            <Icon name="archive" size={18} />
            <span>{T('archived_conversations')}</span>
            <small>{archivedCount}</small>
          </button>
        )}
      </div>
      {m && (
        <footer className="conv-foot">
          <MissionCard id={m.id} compact />
        </footer>
      )}
    </nav>
  );
}
