import { FormEvent, useEffect, useState } from 'react';
import { T } from '../i18n';
import { useReducedMotion, useSession } from './session';

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className={small ? 'logo small' : 'logo'} role="img" aria-label="Gramtele">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M36 13.5A16 16 0 1 0 40 24H25" />
      </svg>
      <span>gramtele</span>
    </div>
  );
}

const BOOT = [
  'wb41 login: restoring image 41-b',
  'mount /dev/vda1 on / (ext4, rw)',
  'wg0: lab vpn up, address 10.40.0.47/24',
  'audit: logging commands to /var/log/workbench/audit.log',
  'starting terminal on pts/0',
];

/** Stages: dark, boot log, logo, connecting, first message. Any key skips it. */
export function Intro({ onDone }: { onDone: () => void }) {
  const s = useSession();
  const reduced = useReducedMotion(s.engine.state.settings.reducedMotion);
  const [stage, setStage] = useState(0);
  const [bootLines, setBootLines] = useState(reduced ? BOOT.length : 0);

  useEffect(() => {
    const times = reduced ? [200, 1400, 1500, 1200] : [1100, 2900, 2400, 1700];
    const timers: number[] = [];
    let at = 0;
    times.forEach((t, i) => {
      at += t;
      timers.push(window.setTimeout(() => setStage(i + 1), at));
    });
    if (!reduced) BOOT.forEach((_, i) => timers.push(window.setTimeout(() => setBootLines(i + 1), times[0] + 200 + i * 480)));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof HTMLButtonElement && e.key !== 'Escape') return;
      e.preventDefault();
      onDone();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onDone]);

  return (
    <main className={`intro ${reduced ? 'no-motion' : ''}`}>
      {stage === 1 && (
        <pre className="intro-boot" aria-label={T('machine_starting')}>
          {BOOT.slice(0, bootLines).map((l) => <div key={l}>{l}</div>)}
        </pre>
      )}
      {stage === 2 && <div className="intro-logo"><Logo /></div>}
      {stage === 3 && <div className="intro-connect"><Logo small /><p>{T('connecting_through_host', { host: 'relay.blackwell.test' })}</p></div>}
      {stage >= 4 && (
        <div className="intro-first">
          <div className="intro-from">NULL</div>
          <p>{T('you_asked_a_careful_question')}</p>
          <p>{T('a_contractor_account_is_waiting')}</p>
          <button className="btn" autoFocus onClick={onDone}>{T('choose_one')}</button>
        </div>
      )}
      {stage < 4 && <button className="intro-skip" onClick={onDone}>{T('skip')}</button>}
    </main>
  );
}

const RESERVED = /^(null|vanta|moth|rootless|echo|admin|root|gramtele|lowtide)$/i;

export function SignUp({ onDone }: { onDone: () => void }) {
  const s = useSession();
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const h = handle.trim();
    if (!/^[a-zA-Z0-9_-]{3,16}$/.test(h)) setError(T('three_to_sixteen_letters_digits'));
    else if (RESERVED.test(h)) setError(T('that_handle_is_taken'));
    else {
      s.engine.signUp(h);
      s.view = 'gramtele';
      s.thread = 'NULL';
      s.conversationOpen = true;
      s.autosave();
      onDone();
    }
  };
  return (
    <main className="signup">
      <Logo small />
      <form onSubmit={submit}>
        <h1>{T('say_it_to_someone_nobody')}</h1>
        <p>{T('gramtele_does_not_ask_for')}</p>
        <label htmlFor="handle">{T('handle')}</label>
        <input id="handle" autoFocus value={handle} maxLength={16} onChange={(e) => { setHandle(e.target.value); setError(null); }} autoComplete="off" spellCheck={false} aria-describedby="handle-note" />
        <p id="handle-note" className={error ? 'finding-wrong' : 'muted'} role={error ? 'alert' : undefined}>{error ?? T('not_your_real_name_this')}</p>
        <button className="btn" type="submit">{T('create_account')}</button>
      </form>
    </main>
  );
}
