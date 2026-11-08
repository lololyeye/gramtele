import { describe, expect, it } from 'vitest';
import { GameEngine } from '../engine';

const make = () => {
  const g = new GameEngine();
  const run = (l: string) => g.runCommand(l);
  return { g, run };
};

describe('shell and filesystem', () => {
  it('reports identity from the real profile', async () => {
    const { run } = make();
    expect(await run('whoami')).toBe('player\n');
    expect(await run('id')).toContain('uid=1000(player)');
    expect(await run('pwd')).toBe('/home/player\n');
  });

  it('creates, moves and removes files for real', async () => {
    const { run, g } = make();
    await run('mkdir -p a/b && echo hello > a/b/c.txt && cp a/b/c.txt d.txt && mv d.txt e.txt');
    expect(await run('cat e.txt')).toBe('hello\n');
    expect(g.fileSystem('workbench').exists('/home/player/d.txt')).toBe(false);
    await run('rm e.txt');
    expect(await run('cat e.txt')).toContain('No such file');
    expect(await run('rm a')).toContain('Is a directory');
    await run('rm -r a');
    expect(g.fileSystem('workbench').exists('/home/player/a')).toBe(false);
  });

  it('runs pipelines, redirection and exit codes', async () => {
    const { run, g } = make();
    await run('echo b > u.txt; echo a >> u.txt; echo b >> u.txt');
    expect(await run('cat u.txt | sort | uniq -c | sort -rn | head -n 1')).toBe('      2 b\n');
    expect(await run('false || echo fallback')).toBe('fallback\n');
    expect(await run('false && echo no')).toBe('');
    expect(await run('echo $?')).toBe('1\n');
    expect(await run('cat missing 2>/dev/null')).toBe('');
    expect(g.shell.lastExit).toBe(1);
  });

  it('expands quotes, variables, globs and substitutions', async () => {
    const { run } = make();
    expect(await run(`export X="a b"; echo "$X" '$X'`)).toBe('a b $X\n');
    expect(await run('touch f1.log f2.log; echo *.log')).toBe('f1.log f2.log\n');
    expect(await run('echo $(whoami)')).toBe('player\n');
    expect(await run('echo "unclosed')).toContain('syntax error');
  });

  it('enforces permissions', async () => {
    const { run } = make();
    expect(await run('cat /var/log/workbench/audit.log')).toContain('Permission denied');
    expect(await run('ls /root')).toContain('Permission denied');
    expect(await run('touch /etc/x')).toContain('Permission denied');
    await run('echo "echo ran" > s.sh');
    expect(await run('./s.sh')).toContain('Permission denied');
    await run('chmod +x s.sh');
    expect(await run('./s.sh')).toBe('ran\n');
    expect(await run('stat s.sh')).toContain('0755');
  });

  it('finds, greps and cuts', async () => {
    const { run } = make();
    expect(await run('find /home -name "intake.txt"')).toBe('/home/player/Documents/assignments/2026/intake/intake.txt\n');
    expect(await run('find / -name relay.conf 2>/dev/null')).toBe('/opt/relay/relay.conf\n');
    expect(await run('grep -c contractor_ref /opt/relay/relay.conf')).toBe('1\n');
    expect(await run('cut -d: -f1 /etc/passwd | head -n 1')).toBe('root\n');
    expect(await run('ls -a')).toContain('.bashrc');
    expect(await run('ls')).not.toContain('.bashrc');
  });

  it('completes paths and commands', async () => {
    const { g } = make();
    expect(g.shell.complete('whoam').options).toEqual(['whoami ']);
    expect(g.shell.complete('cat /opt/rel').options).toEqual(['/opt/relay/']);
  });

  it('keeps tools locked until earned', async () => {
    const { run, g } = make();
    expect(await run('dig nexus-labs.test')).toContain('command not found');
    g.state.tools.push('net');
    expect(await run('dig nexus-labs.test +short')).toBe('192.0.2.40\n');
  });

  it('refuses anything outside the simulation', async () => {
    const { run, g } = make();
    g.state.tools.push('net', 'osint');
    expect(await run('curl http://example.com/')).toContain('Could not resolve');
    expect(await run('curl http://8.8.8.8/')).toContain('Could not resolve');
    expect(await run('ping -c 1 1.1.1.1')).toContain('Name or service not known');
    expect(await run('nmap 8.8.8.8')).toContain('Failed to resolve');
  });

  it('hashes correctly', async () => {
    const { run, g } = make();
    g.state.tools.push('forensics');
    await run('echo -n abc > h.txt');
    expect(await run('sha256sum h.txt')).toContain('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await run('echo -n admin | base64')).toBe('YWRtaW4=\n');
    expect(await run('echo YWRtaW4= | base64 -d')).toBe('admin');
    expect(await run('echo 68656c6c6f | xxd -r -p')).toBe('hello');
  });

  it('runs real SQL and refuses writes to evidence', async () => {
    const { run, g } = make();
    g.state.tools.push('db');
    g.acceptMission('m03');
    expect(await run(`sqlite3 /missions/m03/nexus_archive.db "SELECT count(*) FROM vendors"`)).toBe('7\n');
    expect(await run(`sqlite3 /missions/m03/nexus_archive.db "DELETE FROM vendors"`)).toContain('readonly');
    expect(await run(`sqlite3 /missions/m03/nexus_archive.db "SELECT SUM(amount) FROM invoices WHERE vendor_id=6"`)).toBe('230000\n');
  });
});
