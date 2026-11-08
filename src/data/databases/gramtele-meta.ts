import { int, rng } from '../../game/random';

/** Metadata Gramtele claims not to keep (M7). Synthetic. */
export function gramteleMetaSeed(handle: string, standing = 15): string {
  const r = rng(47);
  const safe = handle.replace(/[^a-z0-9_-]/gi, '');
  const out: string[] = [
    `CREATE TABLE accounts (id INTEGER PRIMARY KEY, handle TEXT UNIQUE, created_on TEXT, standing INTEGER, flags TEXT);`,
    `CREATE TABLE devices (device_id TEXT PRIMARY KEY, first_seen TEXT, client TEXT);`,
    `CREATE TABLE sessions (id INTEGER PRIMARY KEY, account_id INTEGER REFERENCES accounts(id), device_id TEXT REFERENCES devices(device_id), started_at TEXT, ended_at TEXT, source_net TEXT);`,
    `CREATE TABLE contractors (ref TEXT PRIMARY KEY, handle TEXT, engaged_on TEXT, closed_on TEXT, case_ref TEXT, closure TEXT);`,
  ];
  const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);
  const ins = (t: string, vals: (string | number | null)[]) => out.push(`INSERT INTO ${t} VALUES (${vals.map(q).join(',')});`);

  const accounts: [number, string, string, number, string | null][] = [
    [1, 'NULL', '2023-08-02', 940, 'staff-managed'],
    [2, 'VANTA', '2023-08-19', 870, null],
    [3, 'MOTH', '2023-06-30', 610, 'internal'],
    [4, 'ROOTLESS', '2024-01-14', 120, 'watch'],
    [5, 'ECHO', '2025-09-02', 40, 'watch'],
    [6, 'lowtide', '2025-02-11', 0, 'closed'],
    [7, safe, '2026-10-12', standing, 'contractor'],
    [8, 'tinsel', '2024-11-20', 230, null],
    [9, 'ostrich_farm', '2025-05-03', 88, null],
    [10, 'kelpie', '2024-03-08', 410, null],
  ];
  for (const a of accounts) ins('accounts', a);

  const devices: [string, string, string][] = [
    ['d-7f3a', '2023-08-02', 'gt-desktop/3.2 linux'],
    ['d-21c9', '2024-02-27', 'gt-desktop/3.2 linux'],
    ['d-90be', '2023-08-19', 'gt-desktop/3.4 macos'],
    ['d-11aa', '2023-06-30', 'gt-cli/1.1 linux'],
    ['d-4e02', '2024-01-14', 'gt-android/2.9'],
    ['d-b77c', '2025-09-02', 'gt-android/2.9'],
    ['d-c047', '2026-10-12', 'gt-workbench/1.4'],
    ['d-e310', '2025-02-11', 'gt-workbench/1.4'],
    ['d-a1a1', '2024-11-20', 'gt-ios/2.7'],
    ['d-a2a2', '2025-05-03', 'gt-ios/2.7'],
    ['d-a3a3', '2024-03-08', 'gt-android/2.9'],
  ];
  for (const d of devices) ins('devices', d);

  let sid = 1;
  const addSessions = (acct: number, dev: string, n: number, hours: [number, number], net: string) => {
    for (let i = 0; i < n; i++) {
      const day = int(r, 12, 31);
      const month = int(r, 8, 9) === 8 ? '08' : '09';
      const h = int(r, hours[0], hours[1]);
      const start = `2026-${month}-${String(Math.min(day, 30)).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(int(r, 10, 59))}:00`;
      const end = `2026-${month}-${String(Math.min(day, 30)).padStart(2, '0')} ${String(Math.min(h + int(r, 0, 3), 23)).padStart(2, '0')}:${String(int(r, 10, 59))}:00`;
      ins('sessions', [sid++, acct, dev, start, end, net]);
    }
  };
  // NULL is three people on three devices, on shifts.
  addSessions(1, 'd-7f3a', 64, [8, 17], '203.0.113.0/24');
  addSessions(1, 'd-21c9', 41, [0, 6], '203.0.113.0/24');
  addSessions(1, 'd-90be', 23, [13, 20], '203.0.113.0/24');
  // VANTA only ever signs in from a device NULL also uses.
  addSessions(2, 'd-90be', 37, [14, 22], '203.0.113.0/24');
  addSessions(3, 'd-11aa', 52, [0, 23], '198.51.100.0/24');
  addSessions(4, 'd-4e02', 19, [1, 5], '192.0.2.0/24');
  addSessions(5, 'd-b77c', 11, [5, 7], '192.0.2.0/24');
  addSessions(6, 'd-e310', 8, [18, 23], '10.40.0.0/24');
  addSessions(7, 'd-c047', 6, [19, 23], '10.40.0.0/24');
  addSessions(8, 'd-a1a1', 20, [9, 23], '198.51.100.0/24');
  addSessions(9, 'd-a2a2', 13, [9, 23], '198.51.100.0/24');
  addSessions(10, 'd-a3a3', 24, [9, 23], '198.51.100.0/24');

  const contractors: [string, string, string, string | null, string, string][] = [
    ['c-0019', 'pale_horse', '2023-11-02', '2024-02-19', 'Tamber Logistics', 'attributed; referred to police'],
    ['c-0024', 'grebe', '2024-03-11', '2024-07-30', 'Ostrava Dental Group', 'attributed; referred to police'],
    ['c-0031', 'ROOTLESS', '2024-06-03', '2024-11-14', 'Halden Freight', 'attributed; referred to police'],
    ['c-0036', 'mirepoix', '2024-12-01', '2025-03-02', 'Corvane Insurance', 'attributed; civil settlement'],
    ['c-0041', 'lowtide', '2025-02-11', '2025-08-22', 'Brask Utilities', 'attributed; referred to police'],
    ['c-0044', 'unfurl', '2025-10-06', '2026-02-27', 'Sennet Water Board', 'attributed; referred to police'],
    ['c-0047', safe, '2026-10-12', null, 'Nexus Labs', 'scheduled 2026-11-05'],
  ];
  for (const c of contractors) ins('contractors', c);
  return out.join('\n');
}
