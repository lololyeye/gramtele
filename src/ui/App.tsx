import { Component, ReactNode, useEffect, useMemo, useState } from 'react';
import { newState } from '../game/engine';
import type { SlotInfo } from '../game/persistence';
import { Intro, Logo, SignUp } from './Intro';
import { GameShell } from './GameShell';
import { Session, SessionProvider } from './session';

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
        <h1>The interface stopped</h1>
        <p>Your last autosave is intact. Reloading usually fixes this.</p>
        <pre>{this.state.error.message}</pre>
        <div className="row">
          <button className="btn" onClick={() => window.location.reload()}>Reload</button>
          <button className="btn-quiet" onClick={() => {
            const blob = new Blob([s.store.export(s.engine.state)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'gramtele-recovery.json';
            a.click();
          }}>Export a copy of this game</button>
        </div>
      </main>
    );
  }
}

function TitleScreen({ session, onNew, onContinue }: { session: Session; onNew: () => void; onContinue: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const auto: SlotInfo | null = session.store.info('auto');
  return (
    <main className="title-screen">
      <Logo />
      <p className="title-tag">A cybersecurity investigation, played in a terminal.</p>
      <nav className="title-menu" aria-label="Main menu">
        {auto && (
          <button className="title-item primary" autoFocus onClick={() => {
            const r = session.store.load('auto');
            if (!r || 'error' in r) setError(r && 'error' in r ? `The autosave could not be read: ${r.error}` : 'No autosave.');
            else {
              session.replace(r.state);
              onContinue();
            }
          }}>
            Continue
            <small>{auto.handle}, {auto.xp} XP, {new Date(auto.savedAt).toLocaleString()}</small>
          </button>
        )}
        {auto && !confirm ? (
          <button className="title-item" onClick={() => setConfirm(true)}>New game</button>
        ) : (
          <button className={auto ? 'title-item' : 'title-item primary'} autoFocus={!auto} onClick={onNew}>
            {auto ? 'Replace the autosave and begin' : 'Begin'}
          </button>
        )}
        <label className="title-item">
          Import a save
          <input type="file" accept="application/json,.json" className="sr" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = session.store.import(await f.text());
            if ('error' in r) setError(`Import refused: ${r.error}`);
            else {
              session.replace(r.state);
              onContinue();
            }
          }} />
        </label>
      </nav>
      {error && <p className="finding-wrong" role="alert">{error}</p>}
      <p className="title-foot">Everything here is simulated: the machines, the network, the people. Nothing you type leaves this page.</p>
    </main>
  );
}

export function App() {
  const session = useMemo(() => new Session(newState()), []);
  const [phase, setPhase] = useState<Phase>('title');

  useEffect(() => {
    document.title = phase === 'game' ? 'Gramtele' : 'Gramtele';
  }, [phase]);

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
