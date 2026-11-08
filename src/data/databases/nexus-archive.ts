import { int, pick, rng } from '../../game/random';

/** Decommissioned Nexus Labs archive (M3). Entirely synthetic. See docs/STORY_BIBLE.md. */

const q = (v: string | number | null): string => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);
const row = (table: string, vals: (string | number | null)[]) => `INSERT INTO ${table} VALUES (${vals.map(q).join(',')});`;

const FIRST = ['Anna', 'Marek', 'Lucia', 'Tomas', 'Greta', 'Ivo', 'Nadia', 'Oskar', 'Petra', 'Rui', 'Saskia', 'Viktor', 'Wiebke', 'Yusuf', 'Zofia', 'Henrik', 'Lena', 'Mateo', 'Ines', 'Dov', 'Kaja', 'Bruno', 'Alma', 'Emil'];
const LAST = ['Novak', 'Brandt', 'Ferro', 'Holm', 'Sauer', 'Petrov', 'Amari', 'Lund', 'Costa', 'Kovac', 'Weber', 'Rasmus', 'Dalca', 'Ortiz', 'Haas', 'Mertens', 'Sorel', 'Vidal', 'Keller', 'Nyberg'];
const DEPTS = ['Clinical Operations', 'Data Management', 'Biostatistics', 'Quality Assurance', 'Laboratory Services', 'Finance', 'IT'];

export function nexusArchiveSeed(): string {
  const r = rng(417);
  const out: string[] = [];
  out.push(`
CREATE TABLE staff (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  title TEXT,
  hired_on TEXT,
  left_on TEXT
);
CREATE TABLE trials (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  compound TEXT NOT NULL,
  phase TEXT,
  lead_staff_id INTEGER REFERENCES staff(id),
  started_on TEXT,
  status TEXT
);
CREATE TABLE subjects (
  id INTEGER PRIMARY KEY,
  trial_id INTEGER NOT NULL REFERENCES trials(id),
  site_code TEXT,
  arm TEXT,
  enrolled_on TEXT
);
CREATE TABLE adverse_events (
  id INTEGER PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  severity TEXT CHECK (severity IN ('MILD','MODERATE','SERIOUS','FATAL')),
  description TEXT,
  reported_on TEXT,
  reported_by INTEGER REFERENCES staff(id)
);
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY,
  trial_id INTEGER NOT NULL REFERENCES trials(id),
  submitted_on TEXT,
  ae_total INTEGER,
  serious_total INTEGER,
  fatal_total INTEGER,
  filed_by INTEGER REFERENCES staff(id)
);
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  ts TEXT NOT NULL,
  staff_id INTEGER REFERENCES staff(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id INTEGER,
  detail TEXT
);
CREATE TABLE vendors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  contact TEXT
);
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  number TEXT NOT NULL,
  amount REAL NOT NULL,
  issued_on TEXT,
  paid_on TEXT,
  approved_by INTEGER REFERENCES staff(id),
  memo TEXT
);`);

  // ---- staff: named cast first, stable ids ----
  const cast: [number, string, string, string, string, string, string | null][] = [
    [1, 'r.aldana', 'Ruth Aldana', 'Executive', 'Chief Executive Officer', '2011-02-01', null],
    [2, 'k.dressler', 'Konrad Dressler', 'Clinical Operations', 'VP Clinical Operations', '2014-09-15', null],
    [31, 'e.maret', 'Elin Maret', 'Data Management', 'Senior Data Steward', '2018-04-09', '2025-03-28'],
  ];
  for (const s of cast) out.push(row('staff', s));
  const staffIds = [1, 2, 31];
  const used = new Set(cast.map((c) => c[1]));
  for (let id = 3; id <= 42; id++) {
    if (id === 31) continue;
    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    let username = `${first[0].toLowerCase()}.${last.toLowerCase()}`;
    if (used.has(username)) username += id;
    used.add(username);
    const dept = pick(r, DEPTS);
    const left = r() < 0.15 ? `202${int(r, 2, 5)}-0${int(r, 1, 9)}-1${int(r, 0, 9)}` : null;
    out.push(row('staff', [id, username, `${first} ${last}`, dept, `${pick(r, ['Associate', 'Analyst', 'Specialist', 'Manager'])}, ${dept}`, `20${int(r, 12, 22)}-0${int(r, 1, 9)}-0${int(r, 1, 9)}`, left]));
    staffIds.push(id);
  }

  // ---- trials ----
  out.push(row('trials', [1, 'NX-212', 'Ferotane', 'II', 14, '2021-03-02', 'CLOSED']));
  out.push(row('trials', [2, 'NX-305', 'Lumidex', 'II', 19, '2022-10-17', 'CLOSED']));
  out.push(row('trials', [3, 'NX-417', 'Calvexin', 'III', 2, '2023-06-05', 'SUBMITTED']));

  // ---- subjects and events ----
  const severity = ['MILD', 'MILD', 'MILD', 'MODERATE', 'MODERATE', 'SERIOUS'];
  const descriptions = ['Headache', 'Nausea', 'Dizziness', 'Elevated liver enzymes', 'Injection site reaction', 'Fatigue', 'Palpitations', 'Rash', 'Insomnia', 'Transient hypotension'];
  let subjectId = 1000;
  const subjectsByTrial: Record<number, number[]> = { 1: [], 2: [], 3: [] };
  for (const [trial, n] of [[1, 40], [2, 55], [3, 96]] as const) {
    for (let i = 0; i < n; i++) {
      subjectId++;
      subjectsByTrial[trial].push(subjectId);
      out.push(row('subjects', [subjectId, trial, `S${int(r, 1, 6).toString().padStart(2, '0')}`, r() < 0.5 ? 'ACTIVE' : 'PLACEBO', `202${trial + 1}-${String(int(r, 1, 12)).padStart(2, '0')}-${String(int(r, 1, 28)).padStart(2, '0')}`]));
    }
  }
  let aeId = 2000;
  const aeLog: { id: number; ts: string; by: number }[] = [];
  const seriousByTrial: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const [trial, n] of [[1, 22], [2, 31], [3, 38]] as const) {
    for (let i = 0; i < n; i++) {
      aeId++;
      const subj = pick(r, subjectsByTrial[trial]);
      const by = pick(r, staffIds.slice(3));
      const date = `202${trial + 2}-${String(int(r, 1, 12)).padStart(2, '0')}-${String(int(r, 1, 28)).padStart(2, '0')}`;
      const sev = pick(r, severity);
      if (sev === 'SERIOUS') seriousByTrial[trial]++;
      out.push(row('adverse_events', [aeId, subj, sev, pick(r, descriptions), date, by]));
      aeLog.push({ id: aeId, ts: `${date} ${String(int(r, 8, 18)).padStart(2, '0')}:${String(int(r, 10, 59))}:00`, by });
    }
  }

  // AE-2291..2293 were logged, then removed from adverse_events. Only audit_log remembers.
  const deleted = [
    { id: 2291, subj: subjectsByTrial[3][17], sev: 'FATAL', text: 'Sudden cardiac arrest, day 41 of dosing' },
    { id: 2292, subj: subjectsByTrial[3][52], sev: 'FATAL', text: 'Ventricular fibrillation, day 63 of dosing' },
    { id: 2293, subj: subjectsByTrial[3][70], sev: 'SERIOUS', text: 'Cardiac arrest, resuscitated, day 38 of dosing' },
  ];

  // ---- submissions ----
  out.push(row('submissions', [1, 1, '2022-11-30', 22, seriousByTrial[1], 0, 14]));
  out.push(row('submissions', [2, 2, '2024-02-12', 31, seriousByTrial[2], 0, 19]));
  // Filed nine days after the deletions: the totals agree with the table, which is exactly the problem.
  out.push(row('submissions', [3, 3, '2025-03-20', 38, seriousByTrial[3], 0, 2]));

  // ---- vendors and invoices ----
  const vendors = [
    [1, 'Tessel Reagents', 'Laboratory supply', 'orders@tessel.test'],
    [2, 'Marlowe Cold Chain', 'Logistics', 'ops@marlowe.test'],
    [3, 'Quanta Biostat Partners', 'Statistics', 'desk@quanta.test'],
    [4, 'Hartwell Facilities', 'Facilities', 'service@hartwell.test'],
    [5, 'Orion Security', 'IT security', 'engagements@orion-security.test'],
    [6, 'Blackwell Diligence', 'Consulting', 'accounts@blackwell.test'],
    [7, 'Sable Print & Mail', 'Office', 'hello@sable.test'],
  ] as const;
  for (const v of vendors) out.push(row('vendors', [...v]));
  let inv = 88000;
  const routine = [1, 2, 3, 4, 7];
  for (let i = 0; i < 46; i++) {
    inv += int(r, 3, 9);
    const y = int(r, 2023, 2025);
    const m = y === 2025 ? int(r, 1, 2) : int(r, 1, 12);
    const issued = `${y}-${String(m).padStart(2, '0')}-${String(int(r, 1, 20)).padStart(2, '0')}`;
    out.push(row('invoices', [i + 1, pick(r, routine), `INV-${inv}`, Math.round(r() * 2200000) / 100 + 400, issued, issued.slice(0, 8) + String(int(r, 21, 28)), pick(r, [12, 16, 24, 33]), pick(r, ['Monthly supply', 'Quarterly service', 'Project support', 'Consumables', 'Courier services'])]));
  }
  out.push(row('invoices', [47, 5, 'INV-88180', 12800, '2024-11-04', '2024-11-20', 16, 'Annual penetration test']));
  out.push(row('invoices', [48, 6, 'INV-88213', 184000, '2025-03-12', '2025-03-14', 2, 'Crisis readiness retainer']));
  out.push(row('invoices', [49, 6, 'INV-88402', 46000, '2025-04-22', '2025-04-24', 2, 'Reputation monitoring, Q2']));

  // ---- audit log: noise plus the story ----
  type Audit = [string, number, string, string | null, number | null, string];
  const audits: Audit[] = [];
  for (const a of aeLog) audits.push([a.ts, a.by, 'INSERT', 'adverse_events', a.id, 'new adverse event']);
  const actions = ['LOGIN', 'LOGIN', 'LOGIN', 'EXPORT', 'UPDATE'];
  for (let i = 0; i < 340; i++) {
    const y = int(r, 2023, 2025);
    const m = y === 2025 ? int(r, 1, 4) : int(r, 1, 12);
    const ts = `${y}-${String(m).padStart(2, '0')}-${String(int(r, 1, 28)).padStart(2, '0')} ${String(int(r, 8, 18)).padStart(2, '0')}:${String(int(r, 10, 59))}:${String(int(r, 10, 59))}`;
    const action = pick(r, actions);
    const who = pick(r, staffIds.slice(3));
    if (action === 'LOGIN') audits.push([ts, who, 'LOGIN', null, null, 'session opened']);
    else if (action === 'EXPORT') audits.push([ts, who, 'EXPORT', pick(r, ['subjects', 'invoices', 'submissions']), null, 'report export']);
    else audits.push([ts, who, 'UPDATE', 'subjects', pick(r, subjectsByTrial[3]), 'site_code corrected']);
  }
  deleted.forEach((d, i) => {
    audits.push([`2025-03-03 1${i + 1}:0${i + 4}:12`, 37, 'INSERT', 'adverse_events', d.id, `${d.sev}: ${d.text}`]);
  });
  deleted.forEach((d, i) => {
    audits.push([`2025-03-11 23:4${i + 1}:0${i + 6}`, 2, 'DELETE', 'adverse_events', d.id, `removed subject=${d.subj} sev=${d.sev}`]);
  });
  audits.push(['2025-03-12 09:17:44', 31, 'EXPORT', 'audit_log', null, 'full audit export 2025-03-01..2025-03-12']);
  audits.push(['2025-03-13 08:02:10', 2, 'ACCESS_REVOKED', 'staff', 31, 'database access removed for e.maret']);
  audits.push(['2025-03-20 16:30:00', 2, 'INSERT', 'submissions', 3, 'NX-417 safety summary filed']);
  audits.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  audits.forEach((a, i) => out.push(row('audit_log', [i + 1, ...a])));
  return out.join('\n');
}
