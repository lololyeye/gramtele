import { Component, ReactNode, useMemo, useState } from 'react';
import { newState } from '../game/engine';
import type { SlotInfo } from '../game/persistence';
import { LANGUAGES, tr, T } from '../i18n';
import { realDateTime } from './format';
import { Intro, Logo, SignUp } from './Intro';
import { GameShell } from './GameShell';
import { Session, SessionProvider, useSession } from './session';

type Phase = 'title' | 'intro' | 'signup' | 'game';

class Boundary extends Component<{ session: Session; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    const s = this.props.session;
    return (
      <main className="fatal" role="alert">
        <h1>{T('the_interface_stopped')}</h1>
        <p>{T('your_last_autosave_is_intact')}</p>
        <pre>{this.state.error.message}</pre>
        <div className="row">
          <button className="btn" onClick={() => window.location.reload()}>{T('reload')}</button>
          <button className="btn-quiet" onClick={() => {
            const blob = new Blob([s.store.export(s.engine.state)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'gramtele-recovery.json';
            a.click();
          }}>{T('export_a_copy_of_this')}</button>
        </div>
      </main>
    );
  }
}

function TitleLanguage() {
  const s = useSession();
  return (
    <div className="title-lang" role="group" aria-label={T('language')}>
      {LANGUAGES.map((l) => (
        <button key={l.id} type="button" className={s.language === l.id ? 'on' : ''} aria-pressed={s.language === l.id} onClick={() => s.setLanguage(l.id)}>{l.label}</button>
      ))}
    </div>
  );
}

function TitleScreen({ session, onNew, onContinue }: { session: Session; onNew: () => void; onContinue: () => void }) {
  useSession();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const auto: SlotInfo | null = session.store.info('auto');
  return (
    <main className="title-screen">
      <TitleLanguage />
      <Logo />
      <p className="title-tag">{T('a_cybersecurity_investigation_played_in')}</p>
      <nav className="title-menu" aria-label={T('main_menu')}>
        {auto && (
          <button className="title-item primary" autoFocus onClick={() => {
            const r = session.store.load('auto');
            if (!r || 'error' in r) setError(r && 'error' in r ? T('the_autosave_could_not_be', { error: tr(r.error) }) : T('no_autosave'));
            else {
              session.replace(r.state);
              onContinue();
            }
          }}>
            {T('continue')}
            <small>{auto.handle}, {auto.xp} XP, {realDateTime(auto.savedAt)}</small>
          </button>
        )}
        {auto && !confirm ? (
          <button className="title-item" onClick={() => setConfirm(true)}>{T('new_game')}</button>
        ) : (
          <button className={auto ? 'title-item danger' : 'title-item primary'} autoFocus={!auto} onClick={onNew}>
            {auto ? T('replace_the_autosave_and_begin') : T('begin')}
          </button>
        )}
        <label className="title-item">
          {T('import_a_save')}
          <input type="file" accept="application/json,.json" className="sr" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = session.store.import(await f.text());
            if ('error' in r) setError(T('import_refused_error', { error: tr(r.error) }));
            else {
              session.replace(r.state);
              onContinue();
            }
          }} />
        </label>
      </nav>
      {error && <p className="finding-wrong" role="alert">{error}</p>}
      <p className="title-foot">{T('everything_here_is_simulated_the')}</p>
    </main>
  );
}

export function App() {
  const session = useMemo(() => new Session(newState()), []);
  const [phase, setPhase] = useState<Phase>('title');

  return (
    <Boundary session={session}>
      <SessionProvider session={session}>
        {phase === 'title' && (
          <TitleScreen session={session} onContinue={() => setPhase('game')} onNew={() => {
            session.store.remove('auto');
            session.replace(newState());
            setPhase('intro');
          }} />
        )}
        {phase === 'intro' && <Intro onDone={() => setPhase('signup')} />}
        {phase === 'signup' && <SignUp onDone={() => setPhase('game')} />}
        {phase === 'game' && <GameShell onQuit={() => {
          session.autosave();
          setPhase('title');
        }} />}
      </SessionProvider>
    </Boundary>
  );
}
