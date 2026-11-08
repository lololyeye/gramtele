import { KeyboardEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { audio } from './audio';
import { useSession } from './session';

const ANSI_CLASS: Record<string, string> = { '1': 'a-bold', '2': 'a-dim', '31': 'a-red', '32': 'a-exec', '33': 'a-match', '34': 'a-dir', '36': 'a-link' };

/** Renders the small ANSI subset our commands emit. Everything else is plain text; nothing is parsed as HTML. */
export function Ansi({ text }: { text: string }): ReactNode {
  const parts = text.split(/\x1b\[([0-9;]*)m/);
  const out: ReactNode[] = [];
  let cls: string[] = [];
  parts.forEach((p, i) => {
    if (i % 2 === 1) {
      for (const code of p.split(';')) {
        if (code === '0' || code === '') cls = [];
        else if (ANSI_CLASS[code]) cls = [...cls, ANSI_CLASS[code]];
      }
    } else if (p) {
      out.push(cls.length ? <span key={i} className={cls.join(' ')}>{p}</span> : p);
    }
  });
  return <>{out}</>;
}

const ROW_PX = 21;

function FullScreenProgram({ onExit }: { onExit: () => void }) {
  const s = useSession();
  const screen = s.engine.shell.fullscreen;
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(24);
  const [, force] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (ref.current) setRows(Math.max(5, Math.floor((ref.current.clientHeight - 56) / ROW_PX)));
    };
    measure();
    ref.current?.focus();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!screen?.tick) return;
    const t = window.setInterval(() => {
      screen.tick?.();
      force((n) => n + 1);
    }, 1500);
    return () => window.clearInterval(t);
  }, [screen]);

  if (!screen) return null;
  const onKey = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    screen.key(e.ctrlKey && e.key === 'c' ? 'q' : e.key);
    if (screen.done()) {
      s.engine.shell.fullscreen = null;
      onExit();
    }
    force((n) => n + 1);
  };
  return (
    <div className="term-full" ref={ref} tabIndex={0} onKeyDown={onKey} role="application" aria-label={`${screen.title}. Press q to quit.`}>
      <div className="term-full-title">{screen.title}</div>
      <pre className="term-full-body"><Ansi text={screen.render(rows).join('\n')} /></pre>
      <div className="term-full-status">{screen.status()}</div>
    </div>
  );
}

export function TerminalPane({ autoFocus = true }: { autoFocus?: boolean }) {
  const s = useSession();
  const shell = s.engine.shell;
  const [value, setValue] = useState(s.draft);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [multi, setMulti] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const savedDraft = useRef('');
  const lines = s.scrollback;
  const fs = shell.fullscreen;

  useEffect(() => {
    s.draft = value;
  }, [s, value]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, busy, multi]);

  useEffect(() => {
    if (autoFocus && !fs && !busy) input.current?.focus();
  }, [autoFocus, fs, busy]);

  useEffect(() => {
    if (s.scrollback.length === 0 && s.engine.state.shellHistory.length === 0) {
      s.print('Workbench 41, lab VPN 10.40.0.47. Type "help" to list commands and "man NAME" to read a manual.\n');
    }
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const line = value;
    setValue('');
    setHistIdx(null);
    audio.play('enter');
    setBusy(true);
    try {
      if (shell.program) {
        const prog = shell.program;
        const prompt = prog.prompt();
        s.print(line, prompt);
        if (line.trim()) shell.history.push(line);
        const out = await prog.input(line);
        if (out) s.print(out);
        if (prog.done()) shell.program = null;
        s.engine.afterProgramInput();
      } else {
        const prompt = shell.prompt();
        s.print(line, prompt);
        const out = await s.engine.runCommand(line);
        if (shell.clearRequested) {
          shell.clearRequested = false;
          s.clearScreen();
        }
        if (out) s.print(out);
        if (shell.lastExit !== 0 && line.trim()) audio.play('error');
      }
    } catch (e) {
      // A bug in a command must never take the terminal down with it.
      s.print(`bash: internal error: ${(e as Error).message}\n`);
    } finally {
      setBusy(false);
      setMulti(!!shell.program);
      window.setTimeout(() => input.current?.focus(), 0);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) audio.play('key');
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!busy) void submit();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = shell.history;
      if (!h.length) return;
      if (e.key === 'ArrowUp') {
        if (histIdx === null) savedDraft.current = value;
        const i = histIdx === null ? h.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(i);
        setValue(h[i]);
      } else if (histIdx !== null) {
        const i = histIdx + 1;
        if (i >= h.length) {
          setHistIdx(null);
          setValue(savedDraft.current);
        } else {
          setHistIdx(i);
          setValue(h[i]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (shell.program) return;
      const r = shell.complete(value);
      // base is the word being completed; options replace that word.
      const head = value.slice(0, value.length - r.base.length);
      if (r.options.length === 1) setValue(head + r.options[0]);
      else if (r.options.length > 1) {
        const prefix = commonPrefix(r.options);
        if (prefix.length > r.base.length) setValue(head + prefix);
        else {
          s.print(value, shell.prompt());
          s.print(`${r.options.join('  ')}\n`);
        }
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      s.clearScreen();
    } else if (e.ctrlKey && e.key === 'c') {
      if (input.current && input.current.selectionStart !== input.current.selectionEnd) return;
      e.preventDefault();
      s.print(`${value}^C`, shell.program ? shell.program.prompt() : shell.prompt());
      setValue('');
      setHistIdx(null);
    } else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      setValue('');
    }
  };

  return (
    <div className="term" onMouseUp={() => {
      if (!window.getSelection()?.toString()) input.current?.focus();
    }}>
      <div className="term-scroll" ref={scroller}>
        <div role="log" aria-live="polite" aria-label="Terminal output">
          {lines.map((l) => (
            <pre className="term-line" key={l.id}>
              {l.prompt !== undefined && <span className="term-prompt">{l.prompt}</span>}
              <Ansi text={l.text} />
            </pre>
          ))}
        </div>
        {!fs && (
          <div className="term-input-row">
            <label className="term-prompt" htmlFor="term-input">{shell.program ? shell.program.prompt() : shell.prompt()}</label>
            <input
              id="term-input"
              ref={input}
              className="term-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Command"
            />
          </div>
        )}
      </div>
      {fs && <FullScreenProgram onExit={() => window.setTimeout(() => {
        setMulti((m) => !m);
        input.current?.focus();
      }, 0)} />}
    </div>
  );
}

function commonPrefix(list: string[]): string {
  let p = list[0];
  for (const x of list) while (!x.startsWith(p)) p = p.slice(0, -1);
  return p;
}
