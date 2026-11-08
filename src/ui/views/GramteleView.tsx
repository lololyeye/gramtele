import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CHARACTERS, THREAD_ORDER } from '../../data/characters';
import { MISSION_BY_ID } from '../../data/missions';
import type { ChatMessage, ThreadId } from '../../game/types';
import { clock, useSession } from '../session';

function isOnline(online: [number, number] | undefined, now: number): boolean {
  if (!online) return false;
  const h = new Date(now).getUTCHours();
  return h >= online[0] && h <= online[1];
}

function senderLabel(from: string): string {
  return from in CHARACTERS ? CHARACTERS[from as ThreadId].handle : from;
}

function Message({ m, thread, group }: { m: ChatMessage; thread: ThreadId; group: boolean }) {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const mine = m.from === 'me';
  if (m.from === 'sys') return <div className="msg-sys">{m.text}</div>;
  const at = m.attachment;
  const mission = m.invite ? MISSION_BY_ID[m.invite] : null;
  const prog = m.invite ? s.engine.state.missions[m.invite] : null;
  return (
    <div className={mine ? 'msg mine' : 'msg'}>
      {group && !mine && <div className="msg-from">{senderLabel(m.from)}</div>}
      <div className="msg-body">
        {m.text && <p className={/^[A-Za-z0-9+/=\s]{16,}$/.test(m.text) && !m.text.includes(' ') ? 'mono-wrap' : undefined}>{m.text}</p>}
        {at && (
          <div className="attach">
            <div className="attach-head">
              <span className="attach-name">{at.name}</span>
              <span className="attach-kind">{at.kind}</span>
            </div>
            {open && <pre className="attach-preview">{at.preview}</pre>}
            <div className="attach-actions">
              <button className="link" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Close' : 'Inspect'}</button>
              {at.file && (
                <button className="link" disabled={m.taken} onClick={() => s.engine.takeAttachment(thread, m.id)}>
                  {m.taken ? `Saved to ${at.file.path.replace('/home/player', '~')}` : 'Save to workbench'}
                </button>
              )}
            </div>
          </div>
        )}
        {mission && (
          <div className="invite">
            <div className="invite-label">Assignment</div>
            <div className="invite-title">{mission.title}</div>
            <div className="invite-meta">Chapter {mission.chapter}, about {mission.minutes} min, {prog?.status ?? 'offered'}</div>
            <button className="link" onClick={() => s.openMission(mission.id)}>Read the brief</button>
          </div>
        )}
      </div>
      <time className="msg-time">{clock(m.at)}</time>
    </div>
  );
}

function Profile({ id, onClose }: { id: ThreadId; onClose: () => void }) {
  const s = useSession();
  const c = CHARACTERS[id];
  const st = s.engine.state;
  const rel = id in st.relationships ? st.relationships[id as keyof typeof st.relationships] : null;
  return (
    <aside className="profile" aria-label={`Profile of ${c.handle}`}>
      <div className="row-between">
        <h3>{c.handle}</h3>
        <button className="link" onClick={onClose}>Close</button>
      </div>
      <p className="profile-tag">{c.tagline}</p>
      <dl className="kv">
        <dt>Joined</dt><dd>{c.joined}</dd>
        {c.kind === 'contact' && <><dt>Standing</dt><dd>{c.standing}</dd></>}
        {rel !== null && <><dt>Trust in you</dt><dd>{rel > 2 ? 'high' : rel > 0 ? 'some' : rel < 0 ? 'strained' : 'none yet'}</dd></>}
        {c.members && <><dt>Members</dt><dd>{c.members.join(', ')}</dd></>}
      </dl>
      {c.bio.map((b) => <p key={b}>{b}</p>)}
      {c.reveals?.some((r) => st.flags[r.flag]) && (
        <div className="profile-notes">
          <h4>Your notes</h4>
          <dl className="kv">
            {c.reveals.filter((r) => st.flags[r.flag]).map((r) => (
              <div key={r.flag}><dt>{r.label}</dt><dd>{r.value}</dd></div>
            ))}
          </dl>
        </div>
      )}
      {c.kind !== 'group' && (
        <button className="btn-quiet" onClick={() => s.engine.setArchived(id, !st.threads[id]?.archived)}>
          {st.threads[id]?.archived ? 'Unarchive conversation' : 'Archive conversation'}
        </button>
      )}
    </aside>
  );
}

export function GramteleView() {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const [showArchived, setShowArchived] = useState(false);
  const [profile, setProfile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = s.thread;
  const th = st.threads[active];
  const scroller = useRef<HTMLDivElement>(null);
  const av = g.choicesFor(active);
  const typing = g.isTyping(active);

  const ids = THREAD_ORDER.filter((id) => st.threads[id]?.visible && !!st.threads[id].archived === showArchived);
  const archivedCount = THREAD_ORDER.filter((id) => st.threads[id]?.visible && st.threads[id].archived).length;

  useEffect(() => {
    g.markRead(active);
  }, [g, active, th?.messages.length]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active, th?.messages.length, typing, av?.choices.length]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key)) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return;
      const choice = g.choicesFor(active)?.choices[Number(e.key) - 1];
      if (choice) {
        e.preventDefault();
        g.choose(active, choice.id);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [g, active]);

  const pick = (id: ThreadId) => {
    s.thread = id;
    setProfile(false);
    setMobileOpen(true);
    s.notify();
  };

  const c = CHARACTERS[active];
  const online = isOnline(c.online, g.now());

  return (
    <div className={`gram ${mobileOpen ? 'gram-thread-open' : ''}`}>
      <nav className="gram-list" aria-label="Conversations">
        <header className="gram-list-head">
          <span className="wordmark-small">gramtele</span>
          <span className="gram-me">{st.handle}<small>standing {st.standing}</small></span>
        </header>
        <ul>
          {ids.map((id) => {
            const t = st.threads[id];
            const ch = CHARACTERS[id];
            const last = t.messages.at(-1);
            const pendingAnswer = !!g.choicesFor(id);
            return (
              <li key={id}>
                <button className={id === active ? 'conv active' : 'conv'} onClick={() => pick(id)} aria-current={id === active}>
                  <span className="conv-top">
                    <span className="conv-name">
                      {ch.online && <span className={isOnline(ch.online, g.now()) ? 'dot on' : 'dot'} aria-hidden="true" />}
                      {ch.handle}
                      {ch.kind === 'group' && <small> group</small>}
                    </span>
                    {last && <time>{clock(last.at)}</time>}
                  </span>
                  <span className="conv-bottom">
                    <span className="conv-last">{g.isTyping(id) ? 'typing...' : last ? `${last.from === 'me' ? 'You: ' : ''}${last.text || last.attachment?.name || ''}` : ch.tagline}</span>
                    {t.unread > 0 ? <span className="badge" aria-label={`${t.unread} unread`}>{t.unread}</span> : pendingAnswer ? <span className="await" title="Waiting for your answer">reply</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
          {!ids.length && <li className="empty-line">Nothing here.</li>}
        </ul>
        {(archivedCount > 0 || showArchived) && (
          <button className="gram-archive-toggle" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Back to conversations' : `Archived (${archivedCount})`}
          </button>
        )}
      </nav>

      <section className="gram-thread" aria-label={`Conversation with ${c.handle}`}>
        <header className="thread-head">
          <button className="link thread-back" onClick={() => setMobileOpen(false)}>Back</button>
          <button className="thread-who" onClick={() => setProfile(!profile)} aria-expanded={profile}>
            <strong>{c.handle}</strong>
            <span>
              {c.kind === 'group' ? `${c.members?.length ?? 0} members` : c.kind === 'archive' ? c.tagline : typing ? 'typing...' : online ? 'online' : 'offline'}
            </span>
          </button>
          <span className="thread-sec">{c.kind === 'archive' ? 'read only' : 'end-to-end encrypted, the app says'}</span>
        </header>
        <div className="thread-body">
          <div className="thread-scroll" ref={scroller}>
            <div className="thread-inner" role="log" aria-live="polite" aria-label="Messages">
              {th?.messages.map((m) => <Message key={m.id} m={m} thread={active} group={c.kind === 'group'} />)}
              {typing && <div className="typing" aria-label={`${c.handle} is typing`}><i /><i /><i /></div>}
            </div>
          </div>
          {profile && <Profile id={active} onClose={() => setProfile(false)} />}
        </div>
        <footer className="thread-reply">
          {av && av.choices.length > 0 ? (
            <div className="choices" role="group" aria-label="Your reply">
              {av.contactRequest && !th?.messages.some((m) => m.from === 'me') && <p className="choice-note">{c.handle} has asked to contact you.</p>}
              {av.choices.map((ch, i) => (
                <button key={ch.id} className="choice" onClick={() => g.choose(active, ch.id)}>
                  <kbd>{i + 1}</kbd>
                  <span>{ch.label}</span>
                  {ch.decision && <small>This will be remembered</small>}
                </button>
              ))}
            </div>
          ) : (
            <p className="reply-closed">{c.kind === 'archive' ? 'This account is closed.' : typing ? `${c.handle} is writing.` : 'No reply is expected right now.'}</p>
          )}
        </footer>
      </section>
    </div>
  );
}
