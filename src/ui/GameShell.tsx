import { useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '../data/missions';
import { ENDINGS } from '../data/progression';
import { levelFor } from '../game/engine';
import { tr } from '../i18n';
import { MobileNav, NavSidebar, useViews } from './components/NavSidebar';
import { Toasts } from './components/Toasts';
import { Icon, IconButton } from './components/Icon';
import { MessengerView } from './messenger/MessengerView';
import { useReducedMotion, useSession } from './session';
import { TerminalPane } from './TerminalPane';
import { MissionsView } from './views/MissionsView';
import { NetworkView } from './views/NetworkView';
import { EvidenceView, InventoryView, JournalView, SettingsView, SkillsView } from './views/RecordViews';

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
    <aside className="term-side" aria-label={tr('Current assignment')}>
      {m && p ? (
        <section>
          <div className="eyebrow">{tr('Now')}</div>
          <h2>{tr(m.title)}</h2>
          <ol className="mini-objs">
            {m.objectives.map((o) => (
              <li key={o.id} className={p.objectives.includes(o.id) ? 'done' : o === next ? 'next' : ''}>
                {p.objectives.includes(o.id) && <span className="sr">{tr('Complete')}: </span>}
                {tr(o.text)}
              </li>
            ))}
          </ol>
          {open.length > 0 && <p className="side-note">{tr('File findings with the command below, or in Missions.')} <code>submit</code></p>}
          <button className="link" onClick={() => s.openMission(m.id)}>{tr('Open the brief')}</button>
        </section>
      ) : (
        <section>
          <div className="eyebrow">{tr('Now')}</div>
          <p>{tr('No active assignment. Work comes through Gramtele.')}</p>
          <button className="link" onClick={() => s.go('gramtele')}>{tr('Open Gramtele')}</button>
        </section>
      )}
      {note && man?.why && (
        <section className="field-note">
          <div className="eyebrow">{tr('Field note: {name}', { name: note.command })}</div>
          <p>{tr(man.why)}</p>
          <p className="side-note"><code>man {note.command}</code> · {tr('the full manual')}</p>
        </section>
      )}
    </aside>
  );
}

function EndingScreen({ onClose, onQuit }: { onClose: () => void; onQuit: () => void }) {
  const s = useSession();
  const st = s.engine.state;
  const e = st.ending ? ENDINGS[st.ending] : null;
  const done = useRef<HTMLButtonElement>(null);
  useEffect(() => done.current?.focus({ preventScroll: true }), []);
  if (!e) return null;
  const finished = Object.values(st.missions).filter((m) => m.status === 'done').length;
  const stats = s.engine.statistics;
  return (
    <div className="ending" role="dialog" aria-modal="true" aria-label={tr(e.title)}>
      <article>
        <div className="eyebrow">{tr('Ending')}</div>
        <h1>{tr(e.title)}</h1>
        <p className="ending-epigraph">{tr(e.epigraph)}</p>
        {e.paragraphs(st).map((p) => <p key={p}>{tr(p, { handle: st.handle })}</p>)}
        <dl className="ledger">
          <div><dt>{tr('Assignments')}</dt><dd>{finished}</dd></div>
          <div><dt>{tr('Commands')}</dt><dd>{stats.commands}</dd></div>
          <div><dt>{tr('Level')}</dt><dd>{levelFor(st.xp)}</dd></div>
          <div><dt>{tr('Skills proven')}</dt><dd>{st.skills.length}</dd></div>
        </dl>
        <p className="muted">{tr('Five endings exist. Other saves can reach the others, and your decisions change how each one reads.')}</p>
        <div className="row">
          <button ref={done} className="btn" onClick={onClose}>{tr('Keep exploring the workbench')}</button>
          <button className="btn-quiet" onClick={onQuit}>{tr('Back to title')}</button>
        </div>
      </article>
    </div>
  );
}

/** Thin context bar for the views that are not the messenger. */
function ViewBar() {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const m = g.activeMissionDef();
  const p = g.activeProgress();
  const chapter = m ? m.chapter : Object.values(st.missions).filter((x) => x.status === 'done').length;
  const chTitle = CHAPTERS.find((c) => c.n === chapter)?.title;
  return (
    <header className="view-bar">
      <span className="view-bar-chapter">{chTitle ? tr('Chapter {n}: {title}', { n: chapter, title: tr(chTitle) }) : 'Gramtele'}</span>
      {m && p ? (
        <button className="view-bar-mission" onClick={() => s.openMission(m.id)}>
          <Icon name="target" size={15} /> {tr(m.title)} <span>{p.objectives.length}/{m.objectives.length}</span>
        </button>
      ) : <span className="view-bar-mission quiet">{tr('No active assignment')}</span>}
    </header>
  );
}

export function GameShell({ onQuit }: { onQuit: () => void }) {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const views = useViews();
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
        const v = views[Number(e.key) - 1];
        if (v) s.go(v.id);
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
  }, [s, g, views]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${st.settings.fontScale * 100}%`;
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [st.settings.fontScale, reduced]);

  useEffect(() => {
    if (s.view !== 'terminal' && s.view !== 'gramtele') mainRef.current?.focus({ preventScroll: true });
  }, [s.view]);

  const inConversation = s.view === 'gramtele' && s.conversationOpen;

  return (
    <div className={`app ${inConversation ? 'in-conversation' : ''}`}>
      <a className="skip-link" href="#main">{tr('Skip to content')}</a>
      <NavSidebar endingAvailable={!!st.ending} onEnding={() => setEndingOpen(true)} />
      <div className="stage">
        {s.view !== 'gramtele' && <ViewBar />}
        <main id="main" className="view" ref={mainRef} tabIndex={-1}>
          <div key={s.view === 'network' ? 'keep' : s.view} className={s.view === 'network' ? 'view-page hidden' : 'view-page'}>
            {s.view === 'terminal' && (
              <div className="term-view">
                <TerminalPane />
                <AssignmentPanel />
              </div>
            )}
            {s.view === 'gramtele' && <MessengerView />}
            {s.view === 'missions' && <MissionsView />}
            {s.view === 'evidence' && <EvidenceView />}
            {s.view === 'skills' && <SkillsView />}
            {s.view === 'inventory' && <InventoryView />}
            {s.view === 'journal' && <JournalView />}
            {s.view === 'settings' && <SettingsView onQuit={onQuit} />}
          </div>
          {/* Stays mounted, so the browser keeps its page and history when you look elsewhere. */}
          <div className={s.view === 'network' ? 'view-page' : 'view-page hidden'}><NetworkView /></div>
        </main>
        {s.drawerOpen && s.view !== 'terminal' && (
          <section className="drawer" aria-label={tr('Terminal drawer')}>
            <div className="drawer-head">
              <span><Icon name="terminal" size={15} /> {tr('Terminal')}</span>
              <IconButton icon="close" size={16} label={tr('Close the terminal drawer')} onClick={() => s.toggleDrawer()} />
            </div>
            <TerminalPane />
          </section>
        )}
        <MobileNav endingAvailable={!!st.ending} onEnding={() => setEndingOpen(true)} />
      </div>
      <Toasts />
      {endingOpen && <EndingScreen onClose={() => setEndingOpen(false)} onQuit={onQuit} />}
    </div>
  );
}
