import { useEffect, useMemo, useState } from 'react';
import { THREAD_ORDER } from '../../data/characters';
import { levelFor, xpForLevel } from '../../game/engine';
import { getLanguage, tr, ui, T, Tn } from '../../i18n';
import { timeOf } from '../format';
import { Logo } from '../Intro';
import { useSession, ViewId } from '../session';
import { Avatar } from './Avatar';
import { Icon, IconButton, IconName } from './Icon';

interface ViewDef {
  id: ViewId;
  label: string;
  icon: IconName;
}

const VIEWS: { id: ViewId; label: string; icon: IconName }[] = [
  { id: 'gramtele', label: ui('conversations'), icon: 'chat' },
  { id: 'terminal', label: ui('terminal'), icon: 'terminal' },
  { id: 'missions', label: 'Missions', icon: 'target' },
  { id: 'network', label: ui('network'), icon: 'network' },
  { id: 'evidence', label: ui('evidence'), icon: 'evidence' },
  { id: 'skills', label: ui('skills'), icon: 'skills' },
  { id: 'inventory', label: ui('inventory'), icon: 'inventory' },
  { id: 'journal', label: ui('journal'), icon: 'journal' },
  { id: 'settings', label: ui('settings'), icon: 'settings' },
];

/** The nav entries in the current language. Alt+1 to Alt+9 follow this order. */
export function useViews(): ViewDef[] {
  const lang = getLanguage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => VIEWS.map((v) => ({ ...v, label: tr(v.label) })), [lang]);
}

function useCounters() {
  const s = useSession();
  const g = s.engine;
  const unread = THREAD_ORDER.reduce((n, t) => n + (g.state.threads[t]?.muted ? 0 : (g.state.threads[t]?.unread ?? 0)), 0);
  const waiting = THREAD_ORDER.some((t) => g.state.threads[t]?.visible && g.choicesFor(t)?.choices.length);
  return { unread, waiting };
}

const NAV_KEY = 'gramtele.nav';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(NAV_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export function NavSidebar({ endingAvailable, onEnding }: { endingAvailable: boolean; onEnding: () => void }) {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const views = useViews();
  const { unread, waiting } = useCounters();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const level = levelFor(st.xp);
  const progress = (st.xp - xpForLevel(level)) / (xpForLevel(level + 1) - xpForLevel(level));

  useEffect(() => {
    try {
      window.localStorage.setItem(NAV_KEY, collapsed ? 'collapsed' : 'open');
    } catch {
      // Only a convenience: without storage the sidebar simply starts open next time.
    }
  }, [collapsed]);

  return (
    <nav className={collapsed ? 'nav collapsed' : 'nav'} aria-label={T('main')}>
      <div className="nav-brand">
        <button type="button" className="nav-logo" onClick={() => s.go('gramtele')} aria-label={T('open_gramtele')}><Logo small /></button>
        <IconButton icon="panel" size={18} className="nav-toggle" label={collapsed ? T('expand_the_sidebar') : T('collapse_the_sidebar')} onClick={() => setCollapsed(!collapsed)} />
      </div>
      <ul className="nav-items">
        {views.map((v, i) => {
          const active = s.view === v.id;
          const isChat = v.id === 'gramtele';
          return (
            <li key={v.id}>
              <button type="button" className={active ? 'nav-item on' : 'nav-item'} aria-current={active ? 'page' : undefined} aria-keyshortcuts={`Alt+${i + 1}`} title={collapsed ? v.label : `${v.label} (Alt+${i + 1})`} onClick={() => s.go(v.id)}>
                <span className="nav-icon">
                  <Icon name={v.icon} />
                  {isChat && unread > 0 && collapsed && <span key={unread} className="badge dot-badge">{unread}</span>}
                </span>
                <span className="nav-label">{v.label}</span>
                {isChat && unread > 0 && <span key={unread} className="badge" aria-label={Tn('n_unread_message', 'n_unread_messages', unread)}>{unread}</span>}
                {isChat && !unread && waiting && <span className="awaiting" role="img" title={T('waiting_for_your_answer')} aria-label={T('waiting_for_your_answer')} />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="nav-foot">
        {endingAvailable && (
          <button type="button" className="nav-item ending-link" title={T('read_the_ending')} onClick={onEnding}>
            <span className="nav-icon"><Icon name="book" /></span><span className="nav-label">{T('read_the_ending')}</span>
          </button>
        )}
        <button type="button" className={s.drawerOpen ? 'nav-item on-soft' : 'nav-item'} disabled={s.view === 'terminal'} aria-pressed={s.drawerOpen} title={`${T('terminal_drawer')} (Ctrl+\`)`} onClick={() => s.toggleDrawer()}>
          <span className="nav-icon"><Icon name="down" /></span>
          <span className="nav-label">{T('terminal_drawer')}</span>
        </button>
        <div className="nav-me" title={T('level_n', { n: level })}>
          <Avatar id={st.handle || 'me'} size={36} />
          <div className="nav-me-text">
            <strong>{st.handle}</strong>
            <span className="nav-me-meta">{T('level_n', { n: level })} · {st.credits} cr</span>
            <span className="meter thin" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={T('experience')}><i style={{ width: `${progress * 100}%` }} /></span>
          </div>
          <time className="nav-clock" title={T('story_time_utc')}>{timeOf(g.now())}</time>
        </div>
      </div>
    </nav>
  );
}

/** On a phone the main sections sit at the bottom, under the thumb. The rest live behind "More". */
const PRIMARY: ViewId[] = ['gramtele', 'terminal', 'missions', 'network'];

export function MobileNav({ endingAvailable, onEnding }: { endingAvailable: boolean; onEnding: () => void }) {
  const s = useSession();
  const views = useViews();
  const { unread, waiting } = useCounters();
  const [more, setMore] = useState(false);
  const secondary = views.filter((v) => !PRIMARY.includes(v.id));
  const inSecondary = secondary.some((v) => v.id === s.view);
  return (
    <>
      {more && (
        <div className="more-sheet" role="dialog" aria-label={T('more')} onClick={() => setMore(false)}>
          <div className="more-panel" onClick={(e) => e.stopPropagation()}>
            <ul>
              {secondary.map((v) => (
                <li key={v.id}>
                  <button type="button" className={s.view === v.id ? 'on' : ''} onClick={() => { setMore(false); s.go(v.id); }}>
                    <Icon name={v.icon} />{v.label}
                  </button>
                </li>
              ))}
              {endingAvailable && <li><button type="button" onClick={() => { setMore(false); onEnding(); }}><Icon name="book" />{T('read_the_ending')}</button></li>}
            </ul>
          </div>
        </div>
      )}
      <nav className="tabbar" aria-label={T('main')}>
        {views.filter((v) => PRIMARY.includes(v.id)).map((v) => (
          <button key={v.id} type="button" className={s.view === v.id ? 'on' : ''} aria-current={s.view === v.id ? 'page' : undefined} onClick={() => { setMore(false); if (v.id === 'gramtele' && s.view === 'gramtele') s.conversationOpen = false; s.go(v.id); }}>
            <span className="nav-icon">
              <Icon name={v.icon} />
              {v.id === 'gramtele' && unread > 0 && <span className="badge dot-badge">{unread}</span>}
              {v.id === 'gramtele' && !unread && waiting && <span className="awaiting dot-badge" />}
            </span>
            <span>{v.label}</span>
          </button>
        ))}
        <button type="button" className={more || inSecondary ? 'on' : ''} aria-expanded={more} onClick={() => setMore(!more)}>
          <span className="nav-icon"><Icon name="more" /></span>
          <span>{T('more')}</span>
        </button>
      </nav>
    </>
  );
}
