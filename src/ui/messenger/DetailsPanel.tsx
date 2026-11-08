import { useEffect, useRef } from 'react';
import { CHARACTERS } from '../../data/characters';
import { tableFor } from '../../data/reputation';
import { presenceOf } from '../../game/presence';
import { tr, T } from '../../i18n';
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
  if (rel > 2) return T('high');
  if (rel > 0) return T('some');
  if (rel < 0) return T('strained');
  return T('none_yet_2');
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
    <aside className="details" aria-label={T('details_of_name', { name: tr(c.handle) })} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <header className="details-top">
        <h2>{c.kind === 'group' ? T('group_info') : T('contact_info')}</h2>
        <div ref={close}><IconButton icon="close" label={T('close_details')} onClick={onClose} /></div>
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
          <Action icon="pin" label={th?.pinned ? T('unpin') : T('pin')} on={!!th?.pinned} onClick={() => g.togglePinned(thread)} />
          <Action icon="mute" label={th?.muted ? T('unmute') : T('mute')} on={!!th?.muted} onClick={() => g.toggleMuted(thread)} />
          <Action icon="search" label={T('search')} onClick={onSearch} />
          {c.kind !== 'group' && <Action icon="archive" label={th?.archived ? T('restore') : T('archive')} on={!!th?.archived} onClick={() => g.setArchived(thread, !th?.archived)} />}
        </div>

        <section className="details-block">
          <h4>{T('about')}</h4>
          {c.bio.map((b) => <p key={b}>{tr(b)}</p>)}
          <dl className="kv">
            <dt>{T('joined')}</dt><dd>{tr(c.joined)}</dd>
            {c.kind === 'contact' && <><dt>{T('standing')}</dt><dd className="mono">{c.standing}</dd></>}
            {rel !== null && <><dt>{T('trust_in_you')}</dt><dd>{trustLabel(rel)}</dd></>}
          </dl>
        </section>

        {notes.length > 0 && (
          <section className="details-block notes">
            <h4>{T('your_notes')}</h4>
            <dl className="kv stacked">
              {notes.map((r) => <div key={r.flag}><dt>{tr(r.label)}</dt><dd>{tr(r.value)}</dd></div>)}
            </dl>
          </section>
        )}

        {c.kind === 'group' && (
          <section className="details-block">
            <h4>{T('the_table')}</h4>
            <p className="muted">{T('kept_by_ostrich_farm_everyone')}</p>
            <ol className="standing-table">
              {tableFor(st).map((row) => (
                <li key={row.handle} className={row.me ? 'me' : undefined}>
                  <span>{row.handle}{row.me && <small> {T('you')}</small>}</span>
                  <span className="mono">{row.standing}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {c.members && (
          <section className="details-block">
            <h4>{T('members')}</h4>
            <ul className="member-list">
              {c.members.map((m) => <li key={m}><Avatar id={m} size={30} /><span>{senderName(m)}</span></li>)}
              <li><Avatar id={st.handle} size={30} /><span>{st.handle} <small>{T('you')}</small></span></li>
            </ul>
          </section>
        )}

        <section className="details-block">
          <h4>{T('shared_assignments')}</h4>
          {invites.length ? <div className="shared-missions">{invites.map((id) => <MissionCard key={id} id={id} compact />)}</div> : <p className="muted">{T('none_in_this_conversation')}</p>}
        </section>

        <section className="details-block">
          <h4>{T('shared_files')}</h4>
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
          ) : <p className="muted">{T('none_in_this_conversation')}</p>}
        </section>
      </div>
    </aside>
  );
}
