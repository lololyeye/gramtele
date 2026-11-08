import { rankOf } from '../../data/reputation';
import { useRef, useState } from 'react';
import { LANGUAGES, Language, LanguagePref, tr, T, ui } from '../../i18n';
import { Icon } from '../components/Icon';
import { dateTime, realDateTime } from '../format';
import { STATUS_LABEL } from '../messenger/MissionCard';
import { ACHIEVEMENTS, EVIDENCE, SKILL_NODES, SKILL_TITLES } from '../../data/progression';
import { MISSIONS } from '../../data/missions';
import { levelFor, xpForLevel } from '../../game/engine';
import { SLOTS, SlotId } from '../../game/persistence';
import type { JournalKind, SkillId } from '../../game/types';
import { audio } from '../audio';
import { useSession } from '../session';

// ---------- evidence ----------

export function EvidenceView() {
  const s = useSession();
  const st = s.engine.state;
  const [sel, setSel] = useState<string | null>(st.evidence[0]?.id ?? null);
  const e = st.evidence.find((x) => x.id === sel) ?? st.evidence[0];
  const required = Object.values(EVIDENCE).filter((x) => x.exhibit);
  const showExhibits = !!st.missions.m05;
  return (
    <div className="split">
      <nav className="split-nav" aria-label={T('evidence_items')}>
        <h1 className="view-title">{T('evidence')}</h1>
        {st.evidence.map((x) => (
          <button key={x.id} className={e?.id === x.id ? 'nav-item active' : 'nav-item'} onClick={() => setSel(x.id)} aria-current={e?.id === x.id}>
            <span>{tr(x.title)}<small>{tr(x.source)}</small></span>
          </button>
        ))}
        {!st.evidence.length && <p className="empty-line">{T('the_locker_is_empty_hash')} <code>evidence add FILE</code></p>}
      </nav>
      <div className="split-main">
        {e ? (
          <article className="exhibit">
            <div className="eyebrow">{T('item_at_of_total', { at: st.evidence.indexOf(e) + 1, total: st.evidence.length })}</div>
            <h2>{tr(e.title)}</h2>
            <p>{tr(e.summary)}</p>
            <dl className="kv">
              <dt>{T('source')}</dt><dd>{tr(e.source)}</dd>
              <dt>{T('collected')}</dt><dd>{dateTime(e.at)}</dd>
              {e.path && <><dt>{T('path')}</dt><dd><code>{e.path}</code></dd></>}
              <dt>SHA-256</dt><dd><code className="hash">{e.hash ?? T('not_hashed')}</code></dd>
            </dl>
            <p className="muted">{T('a_hash_proves_this_copy')}</p>
          </article>
        ) : <div className="empty"><Icon name="evidence" size={34} /><h2>{T('nothing_collected')}</h2><p>{T('keep_the_originals_note_where')}</p></div>}
        {showExhibits && (
          <section className="exhibits">
            <h3>{T('dossier_exhibits')}</h3>
            <p className="muted">{st.sealed ? T('sealed') : T('copy_these_into_dossier_then')}</p>
            <ul>{required.map((r) => <li key={r.id} className={st.evidence.some((x) => x.id === r.id) ? 'have' : ''}>{tr(r.title)}</li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- skills ----------

export function SkillsView() {
  const s = useSession();
  const st = s.engine.state;
  const level = levelFor(st.xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  const skills = Object.keys(SKILL_TITLES) as SkillId[];
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="view-title">{T('skills')}</h1>
        <div className="level">
          <span className="level-n">{T('level_n', { n: level })}</span>
          <span className="meter" role="progressbar" aria-valuemin={from} aria-valuemax={to} aria-valuenow={st.xp} aria-label={T('experience')}><i style={{ width: `${((st.xp - from) / (to - from)) * 100}%` }} /></span>
          <span className="muted">{st.xp} / {to} XP</span>
        </div>
      </header>
      <p className="muted lede">{T('nodes_open_when_you_demonstrate')}</p>
      <div className="skill-grid">
        {skills.map((id) => {
          const nodes = SKILL_NODES.filter((n) => n.skill === id);
          if (!nodes.length) return null;
          const got = nodes.filter((n) => st.skills.includes(n.id)).length;
          return (
            <section key={id} className="skill-col">
              <h3>{tr(SKILL_TITLES[id])} <small>{T('done_of_total', { done: got, total: nodes.length })}</small></h3>
              <ul>
                {nodes.map((n) => {
                  const have = st.skills.includes(n.id);
                  return (
                    <li key={n.id} className={have ? 'skill have' : 'skill'}>
                      <strong>{have ? tr(n.title) : T('unproven')}</strong>
                      <span>{tr(n.text)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <section className="achievements">
        <h3>{T('achievements')}</h3>
        <ul>
          {ACHIEVEMENTS.filter((a) => !a.hidden || st.achievements.includes(a.id)).map((a) => {
            const have = st.achievements.includes(a.id);
            return <li key={a.id} className={have ? 'have' : ''}><strong>{tr(a.title)}</strong><span>{have ? tr(a.text) : T('not_yet')}</span></li>;
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------- inventory ----------

const TOOLKITS: Record<string, { title: string; text: string; commands: string[] }> = {
  osint: { title: ui('osint_kit'), text: ui('read_public_sources_and_the'), commands: ['exiftool', 'pdftotext', 'strings', 'file', 'curl', 'wget'] },
  forensics: { title: ui('forensics_kit'), text: ui('verify_copies_and_decode_what'), commands: ['sha256sum', 'md5sum', 'base64', 'xxd', 'diff'] },
  db: { title: ui('database_client'), text: ui('a_sqlite_shell_evidence_images'), commands: ['sqlite3'] },
  net: { title: ui('network_kit'), text: ui('name_resolution_routes_ports_and'), commands: ['ping', 'traceroute', 'ip', 'ss', 'dig', 'host', 'whois', 'nmap', 'curl', 'wget'] },
  dossier: { title: ui('dossier_tool'), text: ui('checks_exhibits_by_content_then'), commands: ['dossier'] },
};

export function InventoryView() {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const rank = rankOf(st.standing);
  const available = st.tools.filter((t) => TOOLKITS[t]);
  const fs = g.fileSystem('workbench');
  const list = (dir: string) => {
    const node = fs.lookup(dir);
    return node?.k === 'd' ? Object.keys(node.c).sort() : [];
  };
  const downloads = list('/home/player/Downloads');
  return (
    <div className="page">
      <h1 className="view-title">{T('inventory')}</h1>
      <dl className="ledger">
        <div><dt>{T('credits')}</dt><dd>{st.credits}</dd></div>
        <div><dt>{T('standing')}</dt><dd>{st.standing}</dd></div>
        <div><dt>{T('rank')}</dt><dd>{tr(rank.title)}{rank.next !== null && <small className="rank-next">{T('n_more_to_rank', { n: rank.next - st.standing, rank: tr(rankOf(rank.next).title) })}</small>}</dd></div>
        <div><dt>{T('contractor_id')}</dt><dd className="mono">c-0047</dd></div>
        <div><dt>{T('workbench')}</dt><dd className="mono">10.40.0.47</dd></div>
      </dl>
      <section>
        <h3>{T('toolkits')}</h3>
        <p className="muted">{T('issued_as_assignments_require_them')}</p>
        <ul className="tool-list">
          {available.map((t) => (
            <li key={t}>
              <strong>{tr(TOOLKITS[t].title)}</strong>
              <p>{tr(TOOLKITS[t].text)}</p>
              <p className="cmds">{TOOLKITS[t].commands.map((c) => <code key={c}>{c}</code>)}</p>
            </li>
          ))}
          {!available.length && <li className="empty-line">{T('nothing_issued_yet')}</li>}
        </ul>
      </section>
      <section>
        <h3>~/Downloads</h3>
        {downloads.length ? <ul className="file-list">{downloads.map((f) => <li key={f}><code>{f}</code></li>)}</ul> : <p className="muted">{T('empty_attachments_and_saved_pages')}</p>}
      </section>
      <section>
        <h3>{T('assignments_on_record')}</h3>
        <ul className="file-list">
          {MISSIONS.filter((m) => st.missions[m.id]).map((m) => <li key={m.id}>{tr(m.title)} <span className="muted">· {tr(STATUS_LABEL[st.missions[m.id].status])}</span></li>)}
          {!Object.keys(st.missions).length && <li className="muted">{T('none')}</li>}
        </ul>
      </section>
    </div>
  );
}

// ---------- journal ----------

const KIND_LABEL: Record<JournalKind, string> = { story: ui('event'), decision: ui('decision'), finding: ui('finding'), note: ui('note'), system: ui('system') };

export function JournalView() {
  const s = useSession();
  const st = s.engine.state;
  const [filter, setFilter] = useState<JournalKind | 'all'>('all');
  const [draft, setDraft] = useState('');
  const entries = st.journal.filter((e) => filter === 'all' || e.kind === filter);
  return (
    <div className="page journal">
      <header className="page-head">
        <h1 className="view-title">{T('journal')}</h1>
        <div className="filter" role="group" aria-label={T('filter_entries')}>
          {(['all', 'decision', 'finding', 'story', 'note'] as const).map((k) => (
            <button key={k} className={filter === k ? 'active' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{k === 'all' ? T('all') : tr(KIND_LABEL[k])}</button>
          ))}
        </div>
      </header>
      <form className="note-form" onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        s.engine.addNote(draft.trim());
        setDraft('');
      }}>
        <label htmlFor="note">{T('write_it_down')}</label>
        <div className="finding-row">
          <input id="note" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={T('your_own_note_the_terminal')} />
          <button className="btn-quiet" type="submit">{T('add')}</button>
        </div>
      </form>
      <ol className="entries">
        {entries.map((e, i) => (
          <li key={`${e.at}-${i}`} className={`entry ${e.kind}`}>
            <time>{dateTime(e.at)}</time>
            <span className="entry-kind">{tr(KIND_LABEL[e.kind])}</span>
            <p>{e.vars ? tr(e.text, Object.fromEntries(Object.entries(e.vars).map(([k, v]) => [k, tr(v)]))) : tr(e.text)}</p>
          </li>
        ))}
        {!entries.length && <li className="empty-line">{T('no_entries')}</li>}
      </ol>
    </div>
  );
}

// ---------- settings ----------

function LanguageSection() {
  const s = useSession();
  const pref = s.languagePreference;
  const options: { id: LanguagePref; label: string; note?: string }[] = [
    { id: 'auto', label: T('automatic'), note: T('follows_your_browser_lang', { lang: LANGUAGES.find((l: { id: Language }) => l.id === s.language)?.label ?? '' }) },
    ...LANGUAGES.map((l) => ({ id: l.id as LanguagePref, label: l.label })),
  ];
  return (
    <section>
      <h3>{T('language')}</h3>
      <div className="segmented" role="radiogroup" aria-label={T('language')}>
        {options.map((o) => (
          <label key={o.id} className={pref === o.id ? 'segment on' : 'segment'}>
            <input type="radio" name="language" className="sr" checked={pref === o.id} onChange={() => s.setLanguage(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <p className="muted">{pref === 'auto' ? options[0].note : T('your_choice_stays_until_you')}</p>
    </section>
  );
}

function Slider({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const id = `s-${label}`;
  return (
    <div className="slider">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={0} max={1} step={0.05} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
      <output htmlFor={id}>{Math.round(value * 100)}</output>
    </div>
  );
}

export function SettingsView({ onQuit }: { onQuit: () => void }) {
  const s = useSession();
  const g = s.engine;
  const set = g.state.settings;
  const [note, setNote] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const sound = (fn: (x: typeof set.sound) => void) => {
    g.updateSettings((st) => fn(st.sound));
    audio.apply(g.state.settings.sound);
    audio.play('click');
  };

  const exportSave = () => {
    const blob = new Blob([s.store.export(g.state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gramtele-${g.state.handle || 'save'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNote(T('save_exported'));
  };

  const importSave = async (f: File) => {
    if (f.size > 8_000_000) {
      setNote(T('that_file_is_too_large'));
      return;
    }
    const r = s.store.import(await f.text());
    if ('error' in r) setNote(T('import_refused_error', { error: tr(r.error) }));
    else {
      s.replace(r.state);
      s.autosave();
      setNote(T('save_imported'));
    }
  };

  return (
    <div className="page settings">
      <h1 className="view-title">{T('settings')}</h1>
      <LanguageSection />
      <section>
        <h3>{T('sound')}</h3>
        <label className="check"><input type="checkbox" checked={set.sound.muted} onChange={(e) => sound((x) => { x.muted = e.target.checked; })} /> {T('mute_everything')}</label>
        <Slider label={T('master')} value={set.sound.master} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.master = v; })} />
        <Slider label={T('interface')} value={set.sound.ui} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.ui = v; })} />
        <Slider label={T('typing')} value={set.sound.keys} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.keys = v; })} />
        <Slider label={T('room_tone')} value={set.sound.ambient} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.ambient = v; })} />
      </section>
      <section>
        <h3>{T('display')}</h3>
        <div className="field-row">
          <label htmlFor="motion">{T('motion')}</label>
          <select id="motion" value={set.reducedMotion} onChange={(e) => g.updateSettings((x) => { x.reducedMotion = e.target.value as typeof set.reducedMotion; })}>
            <option value="auto">{T('follow_system')}</option>
            <option value="on">{T('reduced')}</option>
            <option value="off">{T('full')}</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="scale">{T('text_size')}</label>
          <select id="scale" value={set.fontScale} onChange={(e) => g.updateSettings((x) => { x.fontScale = Number(e.target.value); })}>
            <option value={0.9}>{T('small')}</option>
            <option value={1}>{T('default')}</option>
            <option value={1.15}>{T('large')}</option>
            <option value={1.3}>{T('largest')}</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="typing">{T('messages_arrive')}</label>
          <select id="typing" value={set.typingSpeed} onChange={(e) => g.updateSettings((x) => { x.typingSpeed = e.target.value as typeof set.typingSpeed; })}>
            <option value="normal">{T('at_typing_speed')}</option>
            <option value="instant">{T('immediately')}</option>
          </select>
        </div>
        <label className="check"><input type="checkbox" checked={set.fieldNotes} onChange={(e) => g.updateSettings((x) => { x.fieldNotes = e.target.checked; })} /> {T('show_field_notes_beside_the')}</label>
      </section>
      <section>
        <h3>{T('saves')}</h3>
        <p className="muted">{T('the_game_saves_itself_every')}</p>
        <table className="saves">
          <thead><tr><th scope="col">{T('slot')}</th><th scope="col">{T('handle')}</th><th scope="col">XP</th><th scope="col">{T('saved')}</th><th scope="col"><span className="sr">{T('actions')}</span></th></tr></thead>
          <tbody>
            {SLOTS.map((slot: SlotId) => {
              const info = s.store.info(slot);
              return (
                <tr key={slot}>
                  <th scope="row">{slot === 'auto' ? T('autosave') : T('slot_n', { n: slot.slice(-1) })}</th>
                  <td>{info?.handle ?? T('empty')}</td>
                  <td>{info?.xp ?? ''}</td>
                  <td>{info ? realDateTime(info.savedAt) : ''}</td>
                  <td className="save-actions">
                    {slot !== 'auto' && <button className="link" onClick={() => { const r = s.save(slot); setNote(r.ok ? T('saved_2') : T('could_not_save_error', { error: r.error ?? '' })); }}>{T('save')}</button>}
                    {info && <button className="link" onClick={() => {
                      const r = s.store.load(slot);
                      if (!r || 'error' in r) setNote(T('could_not_load_error', { error: tr(r?.error ?? ui('empty_slot')) }));
                      else { s.replace(r.state); setNote(T('loaded')); }
                    }}>{T('load')}</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row">
          <button className="btn-quiet" onClick={exportSave}>{T('export_save')}</button>
          <button className="btn-quiet" onClick={() => file.current?.click()}>{T('import_save')}</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importSave(f);
            e.target.value = '';
          }} />
          <button className="btn-quiet" onClick={onQuit}>{T('save_and_quit_to_title')}</button>
        </div>
        {note && <p role="status" className="form-note">{note}</p>}
        {s.saveError && <p role="alert" className="finding-wrong">{T('autosave_failed_error', { error: s.saveError })}</p>}
      </section>
      <section>
        <h3>{T('reset')}</h3>
        {confirmReset ? (
          <div className="row">
            <span>{T('delete_the_autosave_and_start')}</span>
            <button className="btn-danger" onClick={() => { s.store.remove('auto'); window.location.reload(); }}>{T('delete_and_restart')}</button>
            <button className="btn-quiet" onClick={() => setConfirmReset(false)}>{T('keep_playing')}</button>
          </div>
        ) : <button className="btn-quiet" onClick={() => setConfirmReset(true)}>{T('start_over')}</button>}
      </section>
      <section className="keys">
        <h3>{T('keyboard')}</h3>
        <dl className="kv">
          <dt><kbd>Alt</kbd>+<kbd>1</kbd>-<kbd>9</kbd></dt><dd>{T('switch_view')}</dd>
          <dt><kbd>Ctrl</kbd>+<kbd>`</kbd></dt><dd>{T('terminal_drawer_from_any_view')}</dd>
          <dt><kbd>1</kbd>-<kbd>9</kbd></dt><dd>{T('in_gramtele_choose_a_reply')}</dd>
          <dt><kbd>{T('enter')}</kbd></dt><dd>{T('in_a_message_send_it')}</dd>
          <dt><kbd>Tab</kbd></dt><dd>{T('in_the_terminal_complete_a')}</dd>
          <dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd>{T('in_the_terminal_command_history')}</dd>
          <dt><kbd>Ctrl</kbd>+<kbd>L</kbd></dt><dd>{T('clear_the_terminal')}</dd>
        </dl>
      </section>
    </div>
  );
}
