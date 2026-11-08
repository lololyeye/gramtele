import { useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '../data/missions';
import { ENDINGS } from '../data/progression';
import { levelFor } from '../game/engine';
import { Logo } from './Intro';
import { clock, useReducedMotion, useSession, ViewId } from './session';
import { TerminalPane } from './TerminalPane';
import { GramteleView } from './views/GramteleView';
import { MissionsView } from './views/MissionsView';
import { NetworkView } from './views/NetworkView';
import { EvidenceView, InventoryView, JournalView, SettingsView, SkillsView } from './views/RecordViews';

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'gramtele', label: 'Gramtele' },
  { id: 'missions', label: 'Missions' },
  { id: 'network', label: 'Network' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'skills', label: 'Skills' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'journal', label: 'Journal' },
  { id: 'settings', label: 'Settings' },
];

function AssignmentPanel() {
  const s = useSession();
  const g = s.engine;
  const m = g.activeMissionDef();
  const p = g.activeProgress();
  const note = g.state.settings.fieldNotes ? g.state.fieldNotes[0] : undefined;
  const man = note && g.shell.commands.get(note.command)?.man;
  const next = m && p ? m.objectives.find((o) => !p.objectives.includes(o.id)) : null;
  const open = g.openAnswers();
  return (
    <aside className="term-side" aria-label="Current assignment">
      {m && p ? (
        <section>
          <div className="eyebrow">Now</div>
          <h3>{m.title}</h3>
          <ol className="mini-objs">
            {m.objectives.map((o) => (
              <li key={o.id} className={p.objectives.includes(o.id) ? 'done' : o === next ? 'next' : ''}>
                {o.text}
              </li>
            ))}
          </ol>
          {open.length > 0 && <p className="side-note">File findings with <code>submit</code> here, or in Missions.</p>}
          <button className="link" onClick={() => s.openMission(m.id)}>Open the brief</button>
        </section>
      ) : (
        <section>
          <div className="eyebrow">Now</div>
          <p>No active assignment. Work comes through Gramtele.</p>
          <button className="link" onClick={() => s.go('gramtele')}>Open Gramtele</button>
        </section>
      )}
      {note && man?.why && (
        <section className="field-note">
          <div className="eyebrow">Field note: {note.command}</div>
          <p>{man.why}</p>
          <p className="side-note"><code>man {note.command}</code> has the full manual.</p>
        </section>
      )}
    </aside>
  );
}

function Toasts() {
  const s = useSession();
  const g = s.engine;
  // Conversations you are reading do not need a notification, and three is enough on screen.
  const visible = g.toasts.filter((t) => !(t.kind === 'message' && s.view === 'gramtele' && s.thread === t.thread)).slice(-3);
  const seen = useRef(new WeakSet<object>());

  useEffect(() => {
    for (const t of g.toasts) {
      if (seen.current.has(t)) continue;
      seen.current.add(t);
      window.setTimeout(() => g.dismissToast(t.id), t.kind === 'message' ? 7000 : 5500);
    }
    // No dependency list: new toasts are pushed onto the same array, so its identity does not change.
  });

  return (
    <div className="toasts" role="status" aria-live="polite">
      {visible.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <button className="toast-main" onClick={() => {
            g.dismissToast(t.id);
            if (t.thread) s.openThread(t.thread);
            else if (t.kind === 'objective' || t.kind === 'mission') s.go('missions');
            else if (t.kind === 'evidence') s.go('evidence');
            else if (t.kind === 'skill' || t.kind === 'achievement' || t.kind === 'level') s.go('skills');
          }}>
            <strong>{t.title}</strong>
            {t.body && <span>{t.body}</span>}
          </button>
          <button className="toast-x" aria-label="Dismiss" onClick={() => g.dismissToast(t.id)}>x</button>
        </div>
      ))}
    </div>
  );
}

function EndingScreen({ onClose, onQuit }: { onClose: () => void; onQuit: () => void }) {
  const s = useSession();
  const st = s.engine.state;
  const e = st.ending ? ENDINGS[st.ending] : null;
  const done = useRef<HTMLButtonElement>(null);
  useEffect(() => done.current?.focus({ preventScroll: true }), []);
  if (!e) return null;
  const done_ = Object.values(st.missions).filter((m) => m.status === 'done').length;
  const stats = s.engine.statistics;
  return (
    <div className="ending" role="dialog" aria-modal="true" aria-label={e.title}>
      <article>
        <div className="eyebrow">Ending</div>
        <h1>{e.title}</h1>
        <p className="ending-epigraph">{e.epigraph}</p>
        {e.paragraphs(st).map((p) => <p key={p}>{p}</p>)}
        <dl className="ledger">
          <div><dt>Assignments</dt><dd>{done_}</dd></div>
          <div><dt>Commands</dt><dd>{stats.commands}</dd></div>
          <div><dt>Level</dt><dd>{levelFor(st.xp)}</dd></div>
          <div><dt>Skills proven</dt><dd>{st.skills.length}</dd></div>
        </dl>
        <p className="muted">Five endings exist. Other saves can reach the others, and your decisions change how each one reads.</p>
        <div className="row">
          <button ref={done} className="btn" onClick={onClose}>Keep exploring the workbench</button>
          <button className="btn-quiet" onClick={onQuit}>Back to title</button>
        </div>
      </article>
    </div>
  );
}

export function GameShell({ onQuit }: { onQuit: () => void }) {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const reduced = useReducedMotion(st.settings.reducedMotion);
  const [endingOpen, setEndingOpen] = useState(false);
  const shownEnding = useRef(st.ending);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (st.ending && shownEnding.current !== st.ending) {
      shownEnding.current = st.ending;
      s.autosave();
      const t = window.setTimeout(() => setEndingOpen(true), 1600);
      return () => window.clearTimeout(t);
    }
  }, [s, st.ending]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        s.go(VIEWS[Number(e.key) - 1].id);
      } else if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        if (s.view === 'terminal') return;
        s.toggleDrawer();
      } else if (e.key === 'Escape' && s.drawerOpen && !g.shell.fullscreen) {
        s.toggleDrawer();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [s, g]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${st.settings.fontScale * 100}%`;
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [st.settings.fontScale, reduced]);

  useEffect(() => {
    if (s.view !== 'terminal') mainRef.current?.focus({ preventScroll: true });
  }, [s.view]);

  const unread = Object.values(st.threads).reduce((n, t) => n + t.unread, 0);
  const waiting = (['NULL', 'VANTA', 'MOTH', 'ROOTLESS', 'ECHO'] as const).some((t) => g.choicesFor(t));
  const m = g.activeMissionDef();
  const p = g.activeProgress();
  const chapter = m ? m.chapter : Object.values(st.missions).filter((x) => x.status === 'done').length;
  const chTitle = CHAPTERS.find((c) => c.n === chapter)?.title;

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="rail" aria-label="Main">
        <Logo small />
        <ul>
          {VIEWS.map((v, i) => {
            const count = v.id === 'gramtele' ? unread : 0;
            const dot = v.id === 'gramtele' && !unread && waiting;
            return (
              <li key={v.id}>
                <button className={s.view === v.id ? 'rail-item active' : 'rail-item'} aria-current={s.view === v.id ? 'page' : undefined} aria-keyshortcuts={`Alt+${i + 1}`} onClick={() => s.go(v.id)}>
                  <span className="rail-n" aria-hidden="true">{i + 1}</span>
                  <span>{v.label}</span>
                  {count > 0 && <span className="badge" aria-label={`${count} unread`}>{count}</span>}
                  {dot && <span className="await">reply</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {st.ending && <button className="rail-ending" onClick={() => setEndingOpen(true)}>Read the ending</button>}
        <button className="rail-term" onClick={() => s.view === 'terminal' ? undefined : s.toggleDrawer()} disabled={s.view === 'terminal'}>
          Terminal drawer <kbd>Ctrl</kbd><kbd>`</kbd>
        </button>
      </nav>

      <div className="stage">
        <header className="status">
          <span className="status-chapter">{chTitle ? `Chapter ${chapter}: ${chTitle}` : 'Gramtele'}</span>
          {m && p ? (
            <button className="status-mission" onClick={() => s.openMission(m.id)}>
              {m.title} <span>{p.objectives.length}/{m.objectives.length}</span>
            </button>
          ) : <span className="status-mission muted">No active assignment</span>}
          <span className="grow" />
          <span className="status-item">Level {levelFor(st.xp)}</span>
          <span className="status-item">{st.credits} cr</span>
          <time className="status-item mono">{clock(g.now(), true)} UTC</time>
        </header>
        <div id="main" className="view" ref={mainRef} tabIndex={-1}>
          {s.view === 'terminal' && (
            <div className="term-view">
              <TerminalPane />
              <AssignmentPanel />
            </div>
          )}
          {s.view === 'gramtele' && <GramteleView />}
          {s.view === 'missions' && <MissionsView />}
          <div className={s.view === 'network' ? 'view-keep' : 'view-keep hidden'}><NetworkView /></div>
          {s.view === 'evidence' && <EvidenceView />}
          {s.view === 'skills' && <SkillsView />}
          {s.view === 'inventory' && <InventoryView />}
          {s.view === 'journal' && <JournalView />}
          {s.view === 'settings' && <SettingsView onQuit={onQuit} />}
        </div>
        {s.drawerOpen && s.view !== 'terminal' && (
          <section className="drawer" aria-label="Terminal drawer">
            <div className="drawer-head">
              <span>Terminal</span>
              <button className="link" onClick={() => s.toggleDrawer()}>Close</button>
            </div>
            <TerminalPane />
          </section>
        )}
      </div>
      <Toasts />
      {endingOpen && <EndingScreen onClose={() => setEndingOpen(false)} onQuit={onQuit} />}
    </div>
  );
}
