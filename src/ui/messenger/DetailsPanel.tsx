import { useEffect, useRef } from 'react';
import { CHARACTERS } from '../../data/characters';
import { tableFor } from '../../data/reputation';
import { presenceOf } from '../../game/presence';
import { tr } from '../../i18n';
import type { ThreadId } from '../../game/types';
import { Avatar } from '../components/Avatar';
import { Icon, IconButton, IconName } from '../components/Icon';
import { dateTime, senderName, usernameOf } from '../format';
import { useSession } from '../session';
import { statusLine } from './ChatHeader';
import { MissionCard } from './MissionCard';

function Action({ icon, label, onClick, on }: { icon: IconName; label: string; onClick: () => void; on?: boolean }) {
  return (
    <button type="button" className={on ? 'detail-action on' : 'detail-action'} onClick={onClick} aria-pressed={on}>
      <Icon name={icon} size={18} />
      <span>{label}</span>
    </button>
  );
}

function trustLabel(rel: number): string {
  if (rel > 2) return tr('high');
  if (rel > 0) return tr('some');
  if (rel < 0) return tr('strained');
  return tr('none yet');
}

export function DetailsPanel({ thread, onClose, onFocusMessage, onSearch }: { thread: ThreadId; onClose: () => void; onFocusMessage: (id: number) => void; onSearch: () => void }) {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const c = CHARACTERS[thread];
  const th = st.threads[thread];
  const messages = th?.messages ?? [];
  const files = messages.filter((m) => m.attachment);
  const invites = [...new Set(messages.flatMap((m) => (m.invite ? [m.invite] : [])))];
  const rel = thread in st.relationships ? st.relationships[thread as keyof typeof st.relationships] : null;
  const notes = c.reveals?.filter((r) => st.flags[r.flag]) ?? [];
  const close = useRef<HTMLDivElement>(null);
  const online = c.kind === 'contact' ? presenceOf(c, g.now()).online : undefined;

  useEffect(() => close.current?.querySelector('button')?.focus({ preventScroll: true }), []);

  return (
    <aside className="details" aria-label={tr('Details of {name}', { name: tr(c.handle) })} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <header className="details-top">
        <h2>{c.kind === 'group' ? tr('Group info') : tr('Contact info')}</h2>
        <div ref={close}><IconButton icon="close" label={tr('Close details')} onClick={onClose} /></div>
      </header>
      <div className="details-scroll">
        <section className="details-id">
          <Avatar id={thread} size={92} online={online} muted={c.kind === 'archive'} />
          <h3>{tr(c.handle)}</h3>
          <code>{usernameOf(thread)}</code>
          <p className={online ? 'chat-status on' : 'chat-status'}>{statusLine(s, thread)}</p>
          {c.kind !== 'archive' && <p className="details-tagline">{tr(c.tagline)}</p>}
        </section>

        <div className="details-actions">
          <Action icon="pin" label={th?.pinned ? tr('Unpin') : tr('Pin')} on={!!th?.pinned} onClick={() => g.togglePinned(thread)} />
          <Action icon="mute" label={th?.muted ? tr('Unmute') : tr('Mute')} on={!!th?.muted} onClick={() => g.toggleMuted(thread)} />
          <Action icon="search" label={tr('Search')} onClick={onSearch} />
          {c.kind !== 'group' && <Action icon="archive" label={th?.archived ? tr('Restore') : tr('Archive')} on={!!th?.archived} onClick={() => g.setArchived(thread, !th?.archived)} />}
        </div>

        <section className="details-block">
          <h4>{tr('About')}</h4>
          {c.bio.map((b) => <p key={b}>{tr(b)}</p>)}
          <dl className="kv">
            <dt>{tr('Joined')}</dt><dd>{tr(c.joined)}</dd>
            {c.kind === 'contact' && <><dt>{tr('Standing')}</dt><dd className="mono">{c.standing}</dd></>}
            {rel !== null && <><dt>{tr('Trust in you')}</dt><dd>{trustLabel(rel)}</dd></>}
          </dl>
        </section>

        {notes.length > 0 && (
          <section className="details-block notes">
            <h4>{tr('Your notes')}</h4>
            <dl className="kv stacked">
              {notes.map((r) => <div key={r.flag}><dt>{tr(r.label)}</dt><dd>{tr(r.value)}</dd></div>)}
            </dl>
          </section>
        )}

        {c.kind === 'group' && (
          <section className="details-block">
            <h4>{tr('The table')}</h4>
            <p className="muted">{tr('Kept by ostrich_farm. Everyone says they do not read it.')}</p>
            <ol className="standing-table">
              {tableFor(st).map((row) => (
                <li key={row.handle} className={row.me ? 'me' : undefined}>
                  <span>{row.handle}{row.me && <small> {tr('(you)')}</small>}</span>
                  <span className="mono">{row.standing}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {c.members && (
          <section className="details-block">
            <h4>{tr('Members')}</h4>
            <ul className="member-list">
              {c.members.map((m) => <li key={m}><Avatar id={m} size={30} /><span>{senderName(m)}</span></li>)}
              <li><Avatar id={st.handle} size={30} /><span>{st.handle} <small>{tr('(you)')}</small></span></li>
            </ul>
          </section>
        )}

        <section className="details-block">
          <h4>{tr('Shared assignments')}</h4>
          {invites.length ? <div className="shared-missions">{invites.map((id) => <MissionCard key={id} id={id} compact />)}</div> : <p className="muted">{tr('None in this conversation.')}</p>}
        </section>

        <section className="details-block">
          <h4>{tr('Shared files')}</h4>
          {files.length ? (
            <ul className="shared-files">
              {files.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => onFocusMessage(m.id)}>
                    <Icon name={m.attachment!.kind === 'photo' ? 'photo' : 'file'} size={18} />
                    <span><strong>{m.attachment!.name}</strong><small>{senderName(m.from === 'me' ? st.handle : m.from)} · {dateTime(m.at)}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="muted">{tr('None in this conversation.')}</p>}
        </section>
      </div>
    </aside>
  );
}
