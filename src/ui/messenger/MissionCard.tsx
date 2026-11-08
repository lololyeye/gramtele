import { MISSION_BY_ID } from '../../data/missions';
import { tr, ui, T } from '../../i18n';
import type { MissionProgress } from '../../game/types';
import { useSession } from '../session';

export const STATUS_LABEL: Record<MissionProgress['status'], string> = { offered: ui('offered'), active: ui('in_progress'), done: ui('complete'), declined: ui('declined') };

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
    <button type="button" className={`mission-card ${status} ${compact ? 'compact' : ''}`} onClick={() => s.openMission(id)} aria-label={T('read_the_brief_title', { title: tr(m.title) })}>
      <span className="mission-card-top">
        <span className="mission-chapter">{T('assignment_chapter_n', { n: m.chapter })}</span>
        <span className="mission-status">{tr(STATUS_LABEL[status])}</span>
      </span>
      <strong className="mission-title">{tr(m.title)}</strong>
      {!compact && (
        <span className="mission-facts">
          <span className="mission-diff" role="img" aria-label={T('difficulty_n_of_5', { n: m.difficulty })}>
            {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= m.difficulty ? 'on' : ''} />)}
          </span>
          <span>{T('n_min', { n: m.minutes })}</span>
          <span>{T('n_credits', { n: m.rewards.credits })}</span>
        </span>
      )}
      {status === 'active' && (
        <span className="mission-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={T('objectives')}>
          <i style={{ width: `${(done / total) * 100}%` }} />
        </span>
      )}
      <span className="mission-cta">{status === 'active' ? T('done_of_total_objectives', { done, total }) : status === 'done' ? T('read_the_review') : T('read_the_brief')}</span>
    </button>
  );
}
