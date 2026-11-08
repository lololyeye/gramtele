import { MISSION_BY_ID } from '../../data/missions';
import { tr } from '../../i18n';
import type { MissionProgress } from '../../game/types';
import { useSession } from '../session';

export const STATUS_LABEL: Record<MissionProgress['status'], string> = { offered: 'Offered', active: 'In progress', done: 'Complete', declined: 'Declined' };

/** The assignment card that arrives inside a conversation. Everything on it comes from the mission and its live progress. */
export function MissionCard({ id, compact }: { id: string; compact?: boolean }) {
  const s = useSession();
  const m = MISSION_BY_ID[id];
  const p = s.engine.state.missions[id];
  if (!m) return null;
  const status = p?.status ?? 'offered';
  const done = p?.objectives.length ?? 0;
  const total = m.objectives.length;
  return (
    <button type="button" className={`mission-card ${status} ${compact ? 'compact' : ''}`} onClick={() => s.openMission(id)} aria-label={tr('Read the brief: {title}', { title: tr(m.title) })}>
      <span className="mission-card-top">
        <span className="mission-chapter">{tr('Assignment · chapter {n}', { n: m.chapter })}</span>
        <span className="mission-status">{tr(STATUS_LABEL[status])}</span>
      </span>
      <strong className="mission-title">{tr(m.title)}</strong>
      {!compact && (
        <span className="mission-facts">
          <span className="mission-diff" role="img" aria-label={tr('Difficulty {n} of 5', { n: m.difficulty })}>
            {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= m.difficulty ? 'on' : ''} />)}
          </span>
          <span>{tr('{n} min', { n: m.minutes })}</span>
          <span>{tr('{n} credits', { n: m.rewards.credits })}</span>
        </span>
      )}
      {status === 'active' && (
        <span className="mission-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={tr('Objectives')}>
          <i style={{ width: `${(done / total) * 100}%` }} />
        </span>
      )}
      <span className="mission-cta">{status === 'active' ? tr('{done} of {total} objectives', { done, total }) : status === 'done' ? tr('Read the review') : tr('Read the brief')}</span>
    </button>
  );
}
