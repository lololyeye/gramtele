import { useRef, useState } from 'react';
import { ACHIEVEMENTS, EVIDENCE, SKILL_NODES, SKILL_TITLES } from '../../data/progression';
import { MISSIONS } from '../../data/missions';
import { levelFor, xpForLevel } from '../../game/engine';
import { SLOTS, SlotId } from '../../game/persistence';
import type { JournalKind, SkillId } from '../../game/types';
import { audio } from '../audio';
import { clock, useSession } from '../session';

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
      <nav className="split-nav" aria-label="Evidence items">
        <h2 className="view-title">Evidence</h2>
        {st.evidence.map((x) => (
          <button key={x.id} className={e?.id === x.id ? 'nav-item active' : 'nav-item'} onClick={() => setSel(x.id)} aria-current={e?.id === x.id}>
            <span>{x.title}<small>{x.source}</small></span>
          </button>
        ))}
        {!st.evidence.length && <p className="empty-line">The locker is empty. Hash a file into it with <code>evidence add FILE</code>.</p>}
      </nav>
      <div className="split-main">
        {e ? (
          <article className="exhibit">
            <div className="eyebrow">Item {st.evidence.indexOf(e) + 1} of {st.evidence.length}</div>
            <h2>{e.title}</h2>
            <p>{e.summary}</p>
            <dl className="kv">
              <dt>Source</dt><dd>{e.source}</dd>
              <dt>Collected</dt><dd>{clock(e.at, true)}</dd>
              {e.path && <><dt>Path</dt><dd><code>{e.path}</code></dd></>}
              <dt>SHA-256</dt><dd><code className="hash">{e.hash ?? 'not hashed'}</code></dd>
            </dl>
            <p className="muted">A hash proves this copy has not changed since you collected it. It does not prove the content is true.</p>
          </article>
        ) : <div className="empty"><h2>Nothing collected</h2><p>Keep the originals. Note where they came from.</p></div>}
        {showExhibits && (
          <section className="exhibits">
            <h3>Dossier exhibits</h3>
            <p className="muted">{st.sealed ? 'Sealed.' : 'Copy these into ~/dossier, then run "dossier seal".'}</p>
            <ul>{required.map((r) => <li key={r.id} className={st.evidence.some((x) => x.id === r.id) ? 'have' : ''}>{r.title}</li>)}</ul>
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
        <h2 className="view-title">Skills</h2>
        <div className="level">
          <span className="level-n">Level {level}</span>
          <span className="meter" role="progressbar" aria-valuemin={from} aria-valuemax={to} aria-valuenow={st.xp} aria-label="Experience"><i style={{ width: `${((st.xp - from) / (to - from)) * 100}%` }} /></span>
          <span className="muted">{st.xp} / {to} XP</span>
        </div>
      </header>
      <p className="muted lede">Nodes open when you demonstrate the skill in the terminal. They cannot be bought.</p>
      <div className="skill-grid">
        {skills.map((id) => {
          const nodes = SKILL_NODES.filter((n) => n.skill === id);
          if (!nodes.length) return null;
          const got = nodes.filter((n) => st.skills.includes(n.id)).length;
          return (
            <section key={id} className="skill-col">
              <h3>{SKILL_TITLES[id]} <small>{got} of {nodes.length}</small></h3>
              <ul>
                {nodes.map((n) => {
                  const have = st.skills.includes(n.id);
                  return (
                    <li key={n.id} className={have ? 'skill have' : 'skill'}>
                      <strong>{have ? n.title : 'Unproven'}</strong>
                      <span>{n.text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <section className="achievements">
        <h3>Achievements</h3>
        <ul>
          {ACHIEVEMENTS.filter((a) => !a.hidden || st.achievements.includes(a.id)).map((a) => {
            const have = st.achievements.includes(a.id);
            return <li key={a.id} className={have ? 'have' : ''}><strong>{a.title}</strong><span>{have ? a.text : 'Not yet.'}</span></li>;
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------- inventory ----------

const TOOLKITS: Record<string, { title: string; text: string; commands: string[] }> = {
  osint: { title: 'OSINT kit', text: 'Read public sources and the metadata inside documents.', commands: ['exiftool', 'pdftotext', 'strings', 'file', 'curl', 'wget'] },
  forensics: { title: 'Forensics kit', text: 'Verify copies and decode what you find.', commands: ['sha256sum', 'md5sum', 'base64', 'xxd', 'diff'] },
  db: { title: 'Database client', text: 'A SQLite shell. Evidence images open read-only.', commands: ['sqlite3'] },
  net: { title: 'Network kit', text: 'Name resolution, routes, ports and raw HTTP.', commands: ['ping', 'traceroute', 'ip', 'ss', 'dig', 'host', 'whois', 'nmap', 'curl', 'wget'] },
  dossier: { title: 'Dossier tool', text: 'Checks exhibits by content, then seals them with a manifest.', commands: ['dossier'] },
};

export function InventoryView() {
  const s = useSession();
  const g = s.engine;
  const st = g.state;
  const available = st.tools.filter((t) => TOOLKITS[t]);
  const fs = g.fileSystem('workbench');
  const list = (dir: string) => {
    const node = fs.lookup(dir);
    return node?.k === 'd' ? Object.keys(node.c).sort() : [];
  };
  const downloads = list('/home/player/Downloads');
  return (
    <div className="page">
      <h2 className="view-title">Inventory</h2>
      <dl className="ledger">
        <div><dt>Credits</dt><dd>{st.credits}</dd></div>
        <div><dt>Standing</dt><dd>{st.standing}</dd></div>
        <div><dt>Contractor id</dt><dd>c-0047</dd></div>
        <div><dt>Workbench</dt><dd>10.40.0.47</dd></div>
      </dl>
      <section>
        <h3>Toolkits</h3>
        <p className="muted">Issued as assignments require them. Base Linux tools are always present.</p>
        <ul className="tool-list">
          {available.map((t) => (
            <li key={t}>
              <strong>{TOOLKITS[t].title}</strong>
              <p>{TOOLKITS[t].text}</p>
              <p className="cmds">{TOOLKITS[t].commands.map((c) => <code key={c}>{c}</code>)}</p>
            </li>
          ))}
          {!available.length && <li className="empty-line">Nothing issued yet.</li>}
        </ul>
      </section>
      <section>
        <h3>~/Downloads</h3>
        {downloads.length ? <ul className="file-list">{downloads.map((f) => <li key={f}><code>{f}</code></li>)}</ul> : <p className="muted">Empty. Attachments and saved pages land here.</p>}
      </section>
      <section>
        <h3>Assignments on record</h3>
        <ul className="file-list">
          {MISSIONS.filter((m) => st.missions[m.id]).map((m) => <li key={m.id}>{m.title}: <span className="muted">{st.missions[m.id].status}</span></li>)}
          {!Object.keys(st.missions).length && <li className="muted">None.</li>}
        </ul>
      </section>
    </div>
  );
}

// ---------- journal ----------

const KIND_LABEL: Record<JournalKind, string> = { story: 'Event', decision: 'Decision', finding: 'Finding', note: 'Note', system: 'System' };

export function JournalView() {
  const s = useSession();
  const st = s.engine.state;
  const [filter, setFilter] = useState<JournalKind | 'all'>('all');
  const [draft, setDraft] = useState('');
  const entries = st.journal.filter((e) => filter === 'all' || e.kind === filter);
  return (
    <div className="page journal">
      <header className="page-head">
        <h2 className="view-title">Journal</h2>
        <div className="filter" role="group" aria-label="Filter entries">
          {(['all', 'decision', 'finding', 'story', 'note'] as const).map((k) => (
            <button key={k} className={filter === k ? 'active' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{k === 'all' ? 'All' : KIND_LABEL[k]}</button>
          ))}
        </div>
      </header>
      <form className="note-form" onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        s.engine.addNote(draft.trim());
        setDraft('');
      }}>
        <label htmlFor="note">Write it down</label>
        <div className="finding-row">
          <input id="note" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your own note. The terminal command note does the same." />
          <button className="btn-quiet" type="submit">Add</button>
        </div>
      </form>
      <ol className="entries">
        {entries.map((e, i) => (
          <li key={`${e.at}-${i}`} className={`entry ${e.kind}`}>
            <time>{clock(e.at, true)}</time>
            <span className="entry-kind">{KIND_LABEL[e.kind]}</span>
            <p>{e.text}</p>
          </li>
        ))}
        {!entries.length && <li className="empty-line">No entries.</li>}
      </ol>
    </div>
  );
}

// ---------- settings ----------

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
    setNote('Save exported.');
  };

  const importSave = async (f: File) => {
    if (f.size > 8_000_000) {
      setNote('That file is too large to be a save.');
      return;
    }
    const r = s.store.import(await f.text());
    if ('error' in r) setNote(`Import refused: ${r.error}`);
    else {
      s.replace(r.state);
      s.autosave();
      setNote('Save imported.');
    }
  };

  return (
    <div className="page settings">
      <h2 className="view-title">Settings</h2>
      <section>
        <h3>Sound</h3>
        <label className="check"><input type="checkbox" checked={set.sound.muted} onChange={(e) => sound((x) => { x.muted = e.target.checked; })} /> Mute everything</label>
        <Slider label="Master" value={set.sound.master} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.master = v; })} />
        <Slider label="Interface" value={set.sound.ui} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.ui = v; })} />
        <Slider label="Typing" value={set.sound.keys} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.keys = v; })} />
        <Slider label="Room tone" value={set.sound.ambient} disabled={set.sound.muted} onChange={(v) => sound((x) => { x.ambient = v; })} />
      </section>
      <section>
        <h3>Display</h3>
        <div className="field-row">
          <label htmlFor="motion">Motion</label>
          <select id="motion" value={set.reducedMotion} onChange={(e) => g.updateSettings((x) => { x.reducedMotion = e.target.value as typeof set.reducedMotion; })}>
            <option value="auto">Follow system</option>
            <option value="on">Reduced</option>
            <option value="off">Full</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="scale">Text size</label>
          <select id="scale" value={set.fontScale} onChange={(e) => g.updateSettings((x) => { x.fontScale = Number(e.target.value); })}>
            <option value={0.9}>Small</option>
            <option value={1}>Default</option>
            <option value={1.15}>Large</option>
            <option value={1.3}>Largest</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="typing">Messages arrive</label>
          <select id="typing" value={set.typingSpeed} onChange={(e) => g.updateSettings((x) => { x.typingSpeed = e.target.value as typeof set.typingSpeed; })}>
            <option value="normal">At typing speed</option>
            <option value="instant">Immediately</option>
          </select>
        </div>
        <label className="check"><input type="checkbox" checked={set.fieldNotes} onChange={(e) => g.updateSettings((x) => { x.fieldNotes = e.target.checked; })} /> Show field notes beside the terminal</label>
      </section>
      <section>
        <h3>Saves</h3>
        <p className="muted">The game saves itself every few seconds. Saves stay in this browser.</p>
        <table className="saves">
          <thead><tr><th scope="col">Slot</th><th scope="col">Handle</th><th scope="col">XP</th><th scope="col">Saved</th><th scope="col"><span className="sr">Actions</span></th></tr></thead>
          <tbody>
            {SLOTS.map((slot: SlotId) => {
              const info = s.store.info(slot);
              return (
                <tr key={slot}>
                  <th scope="row">{slot === 'auto' ? 'Autosave' : `Slot ${slot.slice(-1)}`}</th>
                  <td>{info?.handle ?? 'empty'}</td>
                  <td>{info?.xp ?? ''}</td>
                  <td>{info ? new Date(info.savedAt).toLocaleString() : ''}</td>
                  <td className="save-actions">
                    {slot !== 'auto' && <button className="link" onClick={() => { const r = s.save(slot); setNote(r.ok ? 'Saved.' : `Could not save: ${r.error}`); }}>Save</button>}
                    {info && <button className="link" onClick={() => {
                      const r = s.store.load(slot);
                      if (!r || 'error' in r) setNote(`Could not load: ${r?.error ?? 'empty slot'}`);
                      else { s.replace(r.state); setNote('Loaded.'); }
                    }}>Load</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="row">
          <button className="btn-quiet" onClick={exportSave}>Export save</button>
          <button className="btn-quiet" onClick={() => file.current?.click()}>Import save</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importSave(f);
            e.target.value = '';
          }} />
          <button className="btn-quiet" onClick={onQuit}>Save and quit to title</button>
        </div>
        {note && <p role="status" className="form-note">{note}</p>}
        {s.saveError && <p role="alert" className="finding-wrong">Autosave failed: {s.saveError}</p>}
      </section>
      <section>
        <h3>Reset</h3>
        {confirmReset ? (
          <div className="row">
            <span>Delete the autosave and start again? Saved slots stay.</span>
            <button className="btn-danger" onClick={() => { s.store.remove('auto'); window.location.reload(); }}>Delete and restart</button>
            <button className="btn-quiet" onClick={() => setConfirmReset(false)}>Keep playing</button>
          </div>
        ) : <button className="btn-quiet" onClick={() => setConfirmReset(true)}>Start over</button>}
      </section>
      <section className="keys">
        <h3>Keyboard</h3>
        <dl className="kv">
          <dt><kbd>Alt</kbd>+<kbd>1</kbd>-<kbd>9</kbd></dt><dd>Switch view</dd>
          <dt><kbd>Ctrl</kbd>+<kbd>`</kbd></dt><dd>Terminal drawer, from any view</dd>
          <dt><kbd>1</kbd>-<kbd>9</kbd></dt><dd>In Gramtele, choose a reply</dd>
          <dt><kbd>Tab</kbd></dt><dd>In the terminal, complete a name</dd>
          <dt><kbd>Up</kbd> <kbd>Down</kbd></dt><dd>In the terminal, command history</dd>
          <dt><kbd>Ctrl</kbd>+<kbd>L</kbd></dt><dd>Clear the terminal</dd>
        </dl>
      </section>
    </div>
  );
}
