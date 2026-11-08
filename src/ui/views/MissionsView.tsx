import { useEffect, useState } from 'react';
import { CHAPTERS, MISSION_BY_ID, MISSIONS } from '../../data/missions';
import { tr, trn } from '../../i18n';
import { Icon } from '../components/Icon';
import { ReportResult } from '../../game/engine';
import type { AnswerDef, Mission, Objective, ReportDef, ReportSection } from '../../game/types';
import { STATUS_LABEL } from '../messenger/MissionCard';
import { useSession } from '../session';

function FindingField({ def, mission }: { def: AnswerDef; mission: Mission }) {
  const s = useSession();
  const p = s.engine.state.missions[mission.id];
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const filed = p.answers[def.key];
  if (filed !== undefined) {
    return (
      <div className="finding filed">
        <span className="finding-prompt">{tr(def.prompt)}</span>
        <code>{filed}</code>
        {def.right && <p className="finding-why">{tr(def.right)}</p>}
      </div>
    );
  }
  return (
    <form className="finding" onSubmit={(e) => {
      e.preventDefault();
      if (!value.trim()) return;
      const r = s.engine.submit(def.key, value);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setValue('');
    }}>
      <label className="finding-prompt" htmlFor={`f-${def.key}`}>{tr(def.prompt)}</label>
      <div className="finding-row">
        <input id={`f-${def.key}`} value={value} onChange={(e) => setValue(e.target.value)} placeholder={def.placeholder ? tr(def.placeholder) : undefined} autoComplete="off" spellCheck={false} />
        <button className="btn-quiet" type="submit">{tr('File')}</button>
      </div>
      {msg && !msg.ok && <p className="finding-wrong" role="alert">{msg.text}</p>}
    </form>
  );
}

function ObjectiveRow({ o, mission, n, disabled }: { o: Objective; mission: Mission; n: number; disabled?: boolean }) {
  const s = useSession();
  const p = s.engine.state.missions[mission.id];
  const done = p.objectives.includes(o.id);
  const used = p.hints[o.id] ?? 0;
  const answers = [...(o.answer ? [o.answer] : []), ...(o.extraAnswers ?? [])];
  return (
    <li className={done ? 'obj done' : 'obj'}>
      <span className="obj-mark" role="img" aria-label={done ? tr('Complete') : tr('Open')}>{done ? <Icon name="check" size={14} /> : n}</span>
      <div className="obj-body">
        <p className="obj-text">{tr(o.text)}</p>
        {!done && o.note && <p className="obj-note">{tr(o.note)}</p>}
        {!disabled && answers.map((a) => <FindingField key={a.key} def={a} mission={mission} />)}
        {!done && !disabled && (
          <div className="hints">
            {o.hints.slice(0, used).map((h, i) => <p key={h} className="hint"><b>{tr('Hint {n}.', { n: i + 1 })}</b> {tr(h)}</p>)}
            {used < 3 && <button className="link" onClick={() => s.engine.revealHint(mission.id, o.id)}>{used ? tr('Another hint') : tr('I am stuck')}{used === 0 ? '' : ` (${used}/3)`}</button>}
          </div>
        )}
      </div>
    </li>
  );
}

function OrderSection({ sec, value, onChange }: { sec: Extract<ReportSection, { kind: 'order' }>; value: string[]; onChange: (v: string[]) => void }) {
  const move = (i: number, d: number) => {
    const n = [...value];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <ol className="order-list">
      {value.map((id, i) => {
        const it = sec.items.find((x) => x.id === id)!;
        return (
          <li key={id}>
            <span>{tr(it.text)}</span>
            <span className="order-btns">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={tr('Move up: {text}', { text: tr(it.text) })}><Icon name="up" size={15} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={tr('Move down: {text}', { text: tr(it.text) })}><Icon name="down" size={15} /></button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ReportForm({ mission, def }: { mission: Mission; def: ReportDef }) {
  const s = useSession();
  const [resp, setResp] = useState<Record<string, string | string[]>>(() => {
    const init: Record<string, string | string[]> = {};
    for (const x of def.sections) if (x.kind === 'order') init[x.id] = [...x.items].sort((a, b) => a.id.localeCompare(b.id)).map((i) => i.id);
    return init;
  });
  const [result, setResult] = useState<ReportResult | null>(null);
  const allAnswered = def.sections.every((x) => resp[x.id] !== undefined);
  return (
    <form className="report" onSubmit={(e) => {
      e.preventDefault();
      setResult(s.engine.fileReport(mission.id, resp));
    }}>
      <h3>{tr(def.title)}</h3>
      <p>{tr(def.intro)}</p>
      {def.sections.map((sec) => (
        <fieldset key={sec.id} className={sec.kind === 'decision' ? 'report-sec decision' : 'report-sec'}>
          <legend>{tr(sec.title)}</legend>
          <p>{tr(sec.prompt)}</p>
          {sec.kind === 'order' ? (
            <OrderSection sec={sec} value={resp[sec.id] as string[]} onChange={(v) => setResp({ ...resp, [sec.id]: v })} />
          ) : sec.options.map((o) => (
            <label key={o.id} className="radio">
              <input type="radio" name={sec.id} checked={resp[sec.id] === o.id} onChange={() => setResp({ ...resp, [sec.id]: o.id })} />
              <span>{tr(o.text)}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button className="btn" type="submit" disabled={!allAnswered}>{tr('File report')}</button>
      {!allAnswered && <span className="form-note">{tr('Every section needs an answer.')}</span>}
      {result && !result.passed && (
        <div className="report-result" role="alert">
          <h4>{tr('The desk returned your report')}</h4>
          <ul>
            {result.feedback.filter((f) => !f.correct).map((f) => <li key={f.section}><b>{tr(f.section)}.</b> {tr(f.text)}</li>)}
          </ul>
        </div>
      )}
    </form>
  );
}

function Review({ m }: { m: Mission }) {
  const s = useSession();
  const p = s.engine.state.missions[m.id];
  const wrong = p.wrong.length;
  return (
    <section className="review">
      <h3>{tr('Post-assignment review')}</h3>
      <p>{tr(m.review.accomplished)}</p>
      <h4>{tr('Concepts practised')}</h4>
      <ul>{m.review.concepts.map((c) => <li key={c}>{tr(c)}</li>)}</ul>
      <h4>{tr('Why the method works')}</h4>
      <p>{tr(m.review.why)}</p>
      <h4>{tr('In a professional setting')}</h4>
      <p>{tr(m.review.professional)}</p>
      <h4>{tr('How to defend against this')}</h4>
      <ul>{m.review.defend.map((c) => <li key={c}>{tr(c)}</li>)}</ul>
      <h4>{tr('Your run')}</h4>
      <dl className="kv">
        <dt>{tr('Commands')}</dt><dd>{p.commands}</dd>
        <dt>{tr('Hints used')}</dt><dd>{Object.values(p.hints).reduce((a, b) => a + b, 0)}</dd>
        <dt>{tr('Rejected findings')}</dt><dd>{wrong}</dd>
        <dt>{tr('Discoveries')}</dt><dd>{tr('{done} of {total}', { done: p.optionals.length, total: m.optionals.length })}</dd>
        {p.reportScore !== undefined && <><dt>{tr('Report')}</dt><dd>{Math.round(p.reportScore * 100)}%</dd></>}
      </dl>
      {p.optionals.length > 0 && <ul className="discoveries">{m.optionals.filter((o) => p.optionals.includes(o.id)).map((o) => <li key={o.id}><b>{tr(o.title)}.</b> {tr(o.text)}</li>)}</ul>}
      {p.optionals.length < m.optionals.length && <p className="muted">{trn('{n} thing on this assignment went unnoticed. The files are still there.', '{n} things on this assignment went unnoticed. The files are still there.', m.optionals.length - p.optionals.length)}</p>}
    </section>
  );
}

function Brief({ m }: { m: Mission }) {
  const s = useSession();
  const p = s.engine.state.missions[m.id];
  const active = p.status === 'active';
  const done = p.status === 'done';
  const objectivesLeft = m.objectives.filter((o) => o.check.kind !== 'report' && !p.objectives.includes(o.id)).length;
  const reportOpen = m.report && !p.reportDone && active;
  return (
    <article className="brief">
      <header className="brief-head">
        <div className="eyebrow">{tr('Chapter {n}, {title}', { n: m.chapter, title: tr(m.chapterTitle) })}</div>
        <h2>{tr(m.title)}</h2>
        <div className="brief-meta">
          <span>{tr('Contact {name}', { name: m.contact })}</span>
          <span>{tr('Difficulty {n} of 5', { n: m.difficulty })}</span>
          <span>{tr('About {n} min', { n: m.minutes })}</span>
          <span>{tr('{n} credits', { n: m.rewards.credits })}</span>
        </div>
      </header>
      <div className="brief-prose">{m.intro.map((t) => <p key={t}>{tr(t)}</p>)}</div>
      {p.status === 'offered' && (
        <div className="callout">
          <p>{tr('{name} is waiting for your answer on Gramtele.', { name: m.contact })}</p>
          <button className="btn" onClick={() => s.openThread(m.contact)}>{tr('Go to the conversation')}</button>
        </div>
      )}
      <div className="brief-cols">
        <section>
          <h3>{tr('What this teaches')}</h3>
          <dl className="concepts">{m.concepts.map((c) => <div key={c.term}><dt>{tr(c.term)}</dt><dd>{tr(c.text)}</dd></div>)}</dl>
        </section>
        <section>
          <h3>{tr('Environment')}</h3>
          <p>{tr(m.environment)}</p>
          <h3>{tr('Useful here')}</h3>
          <ul className="res">{m.resources.map((r) => <li key={r}><code>{r}</code></li>)}</ul>
        </section>
      </div>
      {(active || done) && (
        <section>
          <h3>{tr('Objectives')}</h3>
          <ol className="objs">{m.objectives.map((o, i) => <ObjectiveRow key={o.id} o={o} n={i + 1} mission={m} disabled={o.check.kind === 'report'} />)}</ol>
        </section>
      )}
      {reportOpen && objectivesLeft === 0 && m.report && <ReportForm mission={m} def={m.report} />}
      {reportOpen && objectivesLeft > 0 && <p className="muted">{tr('The report opens when the other objectives are complete.')}</p>}
      {done && <Review m={m} />}
    </article>
  );
}

export function MissionsView() {
  const s = useSession();
  const st = s.engine.state;
  const fallback = st.activeMission ?? Object.keys(st.missions).at(-1) ?? null;
  const [sel, setSel] = useState<string | null>(s.missionFocus ?? fallback);

  useEffect(() => {
    if (s.missionFocus) {
      setSel(s.missionFocus);
      s.missionFocus = null;
    }
  }, [s, s.missionFocus]);

  const m = sel ? MISSION_BY_ID[sel] : null;
  const unlocked = m && st.missions[m.id];
  return (
    <div className="split">
      <nav className="split-nav" aria-label={tr('Assignments')}>
        <h1 className="view-title">{tr('Assignments')}</h1>
        {CHAPTERS.filter((c) => c.n > 0).map((c) => {
          const items = MISSIONS.filter((x) => x.chapter === c.n);
          return items.map((x) => {
            const p = st.missions[x.id];
            return (
              <button key={x.id} className={sel === x.id ? 'nav-item active' : 'nav-item'} disabled={!p} onClick={() => setSel(x.id)} aria-current={sel === x.id}>
                <span className="nav-item-n">{c.n}</span>
                <span>
                  {p ? tr(x.title) : tr('Not yet offered')}
                  <small>{p ? (p.status === 'active' ? tr('{done} of {total} objectives', { done: p.objectives.length, total: x.objectives.length }) : tr(STATUS_LABEL[p.status])) : tr(c.title)}</small>
                </span>
              </button>
            );
          });
        })}
      </nav>
      <div className="split-main">
        {m && unlocked ? <Brief key={m.id} m={m} /> : <div className="empty"><Icon name="target" size={34} /><h2>{tr('No assignment yet')}</h2><p>{tr('Work arrives through Gramtele. Check your conversations.')}</p><button className="btn-quiet" onClick={() => s.go('gramtele')}>{tr('Open Gramtele')}</button></div>}
      </div>
    </div>
  );
}
