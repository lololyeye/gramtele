import { describe, expect, it } from 'vitest';
import type { EndingId, ThreadId } from './types';
import { GameEngine, newState, levelFor } from './engine';
import { SaveStore, validateSave } from './persistence';

/** Plays the whole game through the same API the interface uses. */
class Player {
  t = 1_000_000;
  g = new GameEngine(newState(), { realNow: () => this.t });
  /** Lets time pass until conversations have settled. */
  settle() {
    for (let i = 0; i < 200; i++) {
      this.t += 5000;
      this.g.tick();
    }
  }
  run(l: string) {
    return this.g.runCommand(l);
  }
  say(thread: ThreadId, choice: string) {
    this.settle();
    const av = this.g.choicesFor(thread);
    expect(av?.choices.map((c) => c.id), `choices in ${thread}`).toContain(choice);
    this.g.choose(thread, choice);
    this.settle();
  }
  sub(k: string, v: string) {
    const r = this.g.submit(k, v);
    expect(r.ok, `${k}=${v}: ${r.message}`).toBe(true);
  }
  expectDone(id: string) {
    const p = this.g.state.missions[id];
    const open = this.g.activeMissionDef()?.objectives.filter((o) => !p.objectives.includes(o.id)).map((o) => o.id);
    expect(p.status, `open: ${open}`).toBe('done');
  }
}

async function playToFinale(gaveLocation: boolean): Promise<Player> {
  const p = new Player();
  p.g.signUp('tester');
  p.say('NULL', 'firm');
  p.say('NULL', 'accept');

  // M1
  await p.run('id');
  p.sub('uid', '1000');
  await p.run('cd /missions/m01');
  await p.run('ls');
  await p.run('find /home -name "intake.txt"');
  await p.run('cat /home/player/Documents/assignments/2026/intake/intake.txt');
  await p.run('cat /opt/relay/relay.conf');
  p.sub('contractor_ref', 'c-0047');
  p.sub('upstream', 'relay.blackwell.test');
  await p.run('cat ~/.cache/.notes_41');
  await p.run('mkdir -p ~/cases/m01 && echo c-0047 > ~/cases/m01/receipt.txt');
  p.expectDone('m01');
  expect(p.g.state.flags.read_notes41).toBe(true);

  p.say('VANTA', 'yes');
  p.settle();

  // M2
  p.say('NULL', 'accept');
  expect(p.g.state.activeMission).toBe('m02');
  expect(p.g.state.tools).toContain('osint');
  await p.run('cd ~/Downloads');
  const found = await p.run('curl -s "http://search.test/search?q=quietfern+filetype:pdf"');
  expect(found).toContain('bulletin-2021-q3.pdf');
  await p.run('curl -s http://trailtalk.test/u/quietfern');
  await p.run('curl -s http://gamersden.test/u/quietfern');
  p.sub('false_profile', 'gamersden.test');
  await p.run('wget -q http://nexus-labs.test/news/bulletin-2021-q3.pdf');
  expect(await p.run('exiftool bulletin-2021-q3.pdf')).toContain('E. Maret');
  expect(await p.run('pdftotext bulletin-2021-q3.pdf | grep quietfern')).toContain('TrailTalk');
  p.sub('real_name', 'Elin Maret');
  await p.run('curl -s http://folio.test/elin.maret');
  await p.run('curl -s http://trailtalk.test/t/hiatus');
  p.sub('left_employer', '2025-03');
  await p.run('wget -q http://trailtalk.test/uploads/ridge_0412.jpg');
  expect(await p.run('exiftool ridge_0412.jpg')).toContain('61.4821');
  expect(await p.run('curl -s "http://maps.test/lookup?lat=61.4821&lon=14.3307"')).toContain('Harrowmere');
  p.sub('town', 'Harrowmere');
  await p.run('evidence add ridge_0412.jpg');
  const bad = p.g.fileReport('m02', { timeline: ['left', 'bulletin', 'return', 'photo'], reliability: 'same-name', limits: 'certain', handover: 'full' });
  expect(bad.passed).toBe(false);
  const report = p.g.fileReport('m02', { timeline: ['bulletin', 'left', 'return', 'photo'], reliability: 'independent', limits: 'indicative', handover: gaveLocation ? 'full' : 'withhold' });
  expect(report.passed).toBe(true);
  p.expectDone('m02');

  // ECHO's first fragment needs decoding before the informed reply appears.
  p.settle();
  expect(p.g.choicesFor('ECHO')?.choices.map((c) => c.id)).toEqual(['what']);
  p.g.takeAttachment('ECHO', p.g.state.threads.ECHO.messages[0].id);
  expect(await p.run('base64 -d ~/Downloads/fragment_01.txt')).toBe('do you know what you looked for');
  p.say('ECHO', 'decoded');
  expect(p.g.state.threads.ECHO.messages.at(-1)?.text).toContain(gaveLocation ? 'garden' : 'why');

  // M3
  p.say('NULL', 'accept');
  const db = 'sqlite3 /missions/m03/nexus_archive.db';
  await p.run(`${db} ".tables"`);
  p.sub('table_count', '8');
  expect(await p.run(`${db} ".schema invoices"`)).toContain('REFERENCES vendors');
  p.sub('fk_column', 'vendor_id');
  expect(await p.run(`${db} "SELECT v.name, SUM(i.amount) FROM invoices i JOIN vendors v ON i.vendor_id = v.id GROUP BY v.name ORDER BY 2 DESC"`)).toContain('Blackwell Diligence|230000');
  p.sub('vendor_total', '230000');
  expect(await p.run(`${db} "SELECT i.number, s.username FROM invoices i JOIN staff s ON i.approved_by = s.id WHERE i.vendor_id = 6"`)).toContain('k.dressler');
  p.sub('approver', 'k.dressler');
  const del = await p.run(`${db} "SELECT a.record_id, s.username, a.detail FROM audit_log a JOIN staff s ON a.staff_id = s.id WHERE a.action = 'DELETE'"`);
  expect(del.trim().split('\n')).toHaveLength(3);
  expect(del.match(/FATAL/g)).toHaveLength(2);
  p.sub('deleted_count', '3');
  await p.run(`${db} "SELECT * FROM submissions"`);
  p.sub('fatal_count', '2');
  await p.run(`${db} "SELECT * FROM audit_log WHERE action='ACCESS_REVOKED'"`);
  await p.run('evidence add /missions/m03/nexus_archive.db');
  expect(p.g.fileReport('m03', { 'why-audit': 'gone', relationship: 'consistent', control: 'sod' }).passed).toBe(true);
  p.expectDone('m03');
  expect(p.g.state.flags.saw_maret_export).toBe(true);
  p.say('VANTA', 'share');
  p.settle();
  expect(p.g.state.threads.NULL.messages.at(-1)?.text).toContain('deleted entries');
  p.say('NULL', 'noticed');

  // M4
  p.say('NULL', 'accept');
  expect(await p.run('ip r')).toContain('default via 10.40.0.1');
  const scan = await p.run('nmap -sn 10.40.0.0/24');
  expect(scan.match(/Nmap scan report/g)).toHaveLength(4);
  p.sub('gateway', '10.40.0.1');
  p.sub('lab_hosts', '4');
  expect(await p.run('dig nexus-labs.test +short')).toBe('192.0.2.40\n');
  expect(await p.run('dig archive-01.nexus-labs.test')).toContain('relay.blackwell.test');
  p.sub('nexus_ip', '192.0.2.40');
  p.sub('archive_alias', 'relay.blackwell.test');
  expect(await p.run('dig nexus-labs.test NS')).toContain('orion-security.test');
  await p.run('dig nexus-labs.test TXT');
  p.sub('dns_operator', 'orion-security.test');
  expect(await p.run('nmap -sV portal.nexus-labs.test')).toContain('debug');
  p.sub('debug_port', '8080');
  expect(await p.run('curl -I http://portal.nexus-labs.test/')).toContain('Werkzeug');
  expect(await p.run('curl -sv https://nexus-labs.test/ 2>&1 | grep issuer')).toContain('Orion Security');
  p.sub('cert_issuer', 'Orion Security');
  const a = await p.run('traceroute nexus-labs.test');
  const b = await p.run('traceroute blackwell.test');
  expect(a).toContain('gw.orion-security.test');
  expect(b).toContain('gw.orion-security.test');
  p.sub('shared_hop', 'gw.orion-security.test');
  await p.run('curl -s http://registry.test/company/hollin-trust');
  expect(p.g.state.flags.knows_hollin).toBe(true);
  expect(p.g.fileReport('m04', { filtered: 'filtered', tcpudp: 'speed', architecture: 'orion' }).passed).toBe(true);
  p.expectDone('m04');
  return p;
}

async function finaleUntilSealed(p: Player) {
  p.say('ROOTLESS', 'yes');
  p.say('ROOTLESS', 'accept');
  expect(p.g.state.activeMission).toBe('m05');
  expect(await p.run('cat /var/log/workbench/audit.log')).toContain('Permission denied');
  expect(await p.run('sudo -l')).toContain('NOPASSWD');
  expect(await p.run('sudo cat /etc/shadow')).toContain('not allowed');
  const log = await p.run('sudo cat /var/log/workbench/audit.log');
  expect(log).toContain('find /home -name'); // the real commands typed earlier
  p.say('MOTH', 'block');
  p.say('MOTH', 'refuse');
  p.settle();
  const msg = p.g.state.threads.ROOTLESS.messages.find((m) => m.attachment?.name === 'gramtele_meta.db')!;
  expect(p.g.takeAttachment('ROOTLESS', msg.id)).toContain('gramtele_meta.db');
  const meta = 'sqlite3 ~/Downloads/gramtele_meta.db';
  const devs = await p.run(`${meta} "SELECT a.handle, s.device_id, COUNT(*) FROM sessions s JOIN accounts a ON a.id = s.account_id GROUP BY 1, 2"`);
  expect(devs).toContain('VANTA|d-90be');
  expect(devs).toContain('NULL|d-90be');
  p.sub('null_devices', '3');
  p.sub('shared_device', 'd-90be');
  expect(await p.run(`${meta} "SELECT * FROM contractors"`)).toContain('scheduled 2026-11-05');
  p.sub('past_contractors', '6');
  p.sub('closure_date', '2026-11-05');
  p.say('VANTA', 'help');
  await p.run('mkdir ~/dossier');
  expect(await p.run('dossier seal')).toContain('Cannot seal');
  await p.run('cp /missions/m03/nexus_archive.db ~/dossier/');
  await p.run('cp ~/Downloads/gramtele_meta.db ~/dossier/');
  await p.run('curl -s -o ~/dossier/press.pdf http://nexus-labs.test/news/nx417-topline.pdf');
  await p.run('curl -s -o ~/dossier/hollin.html http://registry.test/company/hollin-trust');
  await p.run('curl -s -o ~/dossier/halden.pdf http://orion-security.test/reports/halden-freight.pdf');
  // Editing an exhibit breaks it.
  await p.run('echo tampered >> ~/dossier/press.pdf');
  expect(await p.run('dossier seal')).toContain('Cannot seal');
  await p.run('curl -s -o ~/dossier/press.pdf http://nexus-labs.test/news/nx417-topline.pdf');
  expect(await p.run('dossier seal')).toContain('Sealed');
  expect(p.g.state.sealed).toBe(true);
  p.settle();
}

describe('full playthrough', () => {
  it('reaches the Archive ending from a real curl upload', async () => {
    const p = await playToFinale(false);
    await finaleUntilSealed(p);
    await p.run('cd ~ && echo scraps > notes.txt');
    expect(await p.run('curl -s -F file=@notes.txt http://archive.test/submit')).toContain('not a sealed dossier');
    expect(p.g.state.ending).toBeNull();
    expect(await p.run('curl -s -F file=@dossier.tar http://archive.test/submit')).toContain('received');
    expect(p.g.state.ending).toBe<EndingId>('record');
    p.expectDone('m05');
    expect(p.g.state.skills.length).toBeGreaterThan(10);
    expect(levelFor(p.g.state.xp)).toBeGreaterThan(3);
  });

  it('reaches the other endings through conversations, and earlier choices matter', async () => {
    const p = await playToFinale(true);
    expect(p.g.state.flags.gave_location).toBe(true);
    await finaleUntilSealed(p);
    p.say('ECHO', 'wait');
    p.say('ECHO', 'custody');
    expect(p.g.state.ending).toBe<EndingId>('custody');

    const q = await playToFinale(false);
    await finaleUntilSealed(q);
    q.say('NULL', 'later');
    q.say('NULL', 'seat');
    expect(q.g.state.ending).toBe<EndingId>('seat');

    const r = await playToFinale(false);
    await finaleUntilSealed(r);
    r.say('MOTH', 'sell');
    expect(r.g.state.ending).toBe<EndingId>('leverage');

    const s = await playToFinale(false);
    await finaleUntilSealed(s);
    s.say('NULL', 'ghost');
    expect(s.g.state.ending).toBe<EndingId>('ghost');
    expect(s.g.state.flags.sealed_kept).toBe(true);
    // The first ending stands: nothing later can replace it.
    s.g.apply([{ ending: 'seat' }]);
    expect(s.g.state.ending).toBe<EndingId>('ghost');
  }, 60000);

  it('survives save, reload and export', async () => {
    const p = new Player();
    p.g.signUp('saver');
    p.say('NULL', 'how');
    p.say('NULL', 'accept');
    await p.run('echo kept > ~/kept.txt');
    await p.run('cd /opt');
    const mem = new Map<string, string>();
    const store = new SaveStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) });
    expect(store.save('slot1', p.g.state).ok).toBe(true);
    const loaded = store.load('slot1');
    if (!loaded || 'error' in loaded) throw new Error('load failed');
    const g2 = new GameEngine(loaded.state);
    expect(await g2.runCommand('cat ~/kept.txt')).toBe('kept\n');
    expect(await g2.runCommand('pwd')).toBe('/opt\n');
    expect(g2.state.activeMission).toBe('m01');
    expect(g2.shell.history).toContain('echo kept > ~/kept.txt');

    const imported = store.import(store.export(p.g.state));
    expect('state' in imported).toBe(true);
  });

  it('rejects malformed saves', () => {
    expect('error' in validateSave(null)).toBe(true);
    expect('error' in validateSave({ version: 999 })).toBe(true);
    expect('error' in validateSave({ ...newState(), handle: '<script>' })).toBe(true);
    expect('error' in validateSave({ ...newState(), fs: { workbench: { k: 'd', mode: 1, uid: 0, gid: 0, mtime: 0, c: { 'a/b': {} } } } })).toBe(true);
  });
});
