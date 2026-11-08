import { useEffect, useRef } from 'react';
import { tr } from '../../i18n';
import type { Toast } from '../../game/types';
import { useSession } from '../session';
import { Avatar } from './Avatar';
import { Icon, IconButton, IconName } from './Icon';

const KIND_ICON: Record<Exclude<Toast['kind'], 'message'>, IconName> = {
  objective: 'check',
  mission: 'target',
  level: 'skills',
  achievement: 'skills',
  skill: 'skills',
  evidence: 'evidence',
  system: 'info',
};

export function Toasts() {
  const s = useSession();
  const g = s.engine;
  // A conversation you are reading needs no notification, and three is enough on screen.
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
          <button type="button" className="toast-main" onClick={() => {
            g.dismissToast(t.id);
            if (t.thread) s.openThread(t.thread);
            else if (t.kind === 'objective' || t.kind === 'mission') s.go('missions');
            else if (t.kind === 'evidence') s.go('evidence');
            else if (t.kind === 'skill' || t.kind === 'achievement' || t.kind === 'level') s.go('skills');
          }}>
            {t.kind === 'message' && t.thread ? <Avatar id={t.thread} size={36} /> : <span className="toast-icon"><Icon name={KIND_ICON[t.kind as keyof typeof KIND_ICON]} size={18} /></span>}
            <span className="toast-text">
              <strong>{t.title}</strong>
              {t.body && <span>{t.body}</span>}
            </span>
          </button>
          <IconButton icon="close" size={14} label={tr('Dismiss')} onClick={() => g.dismissToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
