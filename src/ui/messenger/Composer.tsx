import { KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import { ROOT } from '../../game/filesystem/vfs';
import { tr, T } from '../../i18n';
import type { ThreadId } from '../../game/types';
import { Icon, IconButton } from '../components/Icon';
import { shortPath } from '../format';
import { useSession } from '../session';

function FilePicker({ onPick, onClose }: { onPick: (path: string) => void; onClose: () => void }) {
  const s = useSession();
  const files = useMemo(() => {
    const out: string[] = [];
    s.engine.fileSystem('workbench').walkTree('/home/player', ROOT, (path, n) => {
      if (n.k === 'f' && !path.split('/').some((part) => part.startsWith('.'))) out.push(path);
    });
    return out.sort();
  }, [s.engine]);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <div className="file-picker" role="dialog" aria-label={T('attach_a_file_from_the')} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <header>
        <strong>{T('attach_from_the_workbench')}</strong>
        <IconButton icon="close" size={16} label={T('close')} onClick={onClose} />
      </header>
      <ul>
        {files.map((f, i) => (
          <li key={f}>
            <button type="button" ref={i === 0 ? first : undefined} onClick={() => onPick(f)}>
              <Icon name={/\.(jpe?g|png)$/i.test(f) ? 'photo' : 'file'} size={16} />
              <code>{shortPath(f)}</code>
            </button>
          </li>
        ))}
        {!files.length && <li className="empty-line">{T('your_home_directory_has_nothing')}</li>}
      </ul>
    </div>
  );
}

export function Composer({ thread }: { thread: ThreadId }) {
  const s = useSession();
  const g = s.engine;
  const [value, setValue] = useState(s.drafts[thread] ?? '');
  const [picking, setPicking] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const writable = g.canWrite(thread);
  const c = CHARACTERS[thread];

  useEffect(() => {
    setValue(s.drafts[thread] ?? '');
    setPicking(false);
  }, [s, thread]);

  // Auto-growing field: measure at auto height, then fix it. The stylesheet caps it at about six lines.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, thread]);

  const update = (v: string) => {
    setValue(v);
    s.drafts[thread] = v;
  };

  const send = () => {
    if (g.sendMessage(thread, value) === 'refused') return;
    update('');
    box.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  if (!writable) {
    return <div className="composer-closed"><Icon name="lock" size={16} /><span>{T('this_account_is_closed_you')}</span></div>;
  }

  const ready = !!value.trim();
  return (
    <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
      {picking && <FilePicker onClose={() => setPicking(false)} onPick={(path) => { g.sendFile(thread, path); setPicking(false); box.current?.focus(); }} />}
      <div className={ready ? 'composer-field has-text' : 'composer-field'}>
        <IconButton icon="clip" label={T('attach_a_file_from_the')} active={picking} onClick={() => setPicking(!picking)} />
        <textarea
          ref={box}
          rows={1}
          value={value}
          onChange={(e) => update(e.target.value)}
          onKeyDown={onKey}
          placeholder={T('message_name', { name: tr(c.handle) })}
          aria-label={T('message_name', { name: tr(c.handle) })}
          aria-keyshortcuts="Enter"
          maxLength={2000}
          spellCheck
        />
        <button type="submit" className="send-btn" disabled={!ready} aria-label={T('send')} title={T('send_enter_shift_enter_starts')}>
          <Icon name="send" />
        </button>
      </div>
    </form>
  );
}
