import { installFile, ROOT, SeedFile, VFS } from '../../game/filesystem/vfs';

/** Base filesystems for each machine. Content a mission adds lives with that mission. */

const T0 = Date.UTC(2026, 8, 28, 9, 0, 0); // image built 28 Sep 2026
export const PLAYER_UID = 1000;
export const LAB_GID = 1001;
const P = { uid: PLAYER_UID, gid: PLAYER_UID };

const f = (path: string, data: string, extra: Partial<SeedFile> = {}): SeedFile => ({ path, data, mtime: T0, ...extra });

export function seedWorkbench(fs: VFS): void {
  for (const d of ['/bin', '/dev', '/usr/bin', '/usr/local/bin', '/tmp', '/opt/toolkit/bin', '/var/log/workbench', '/missions', '/root']) fs.mkdir(d, ROOT, true);
  fs.chmod('/tmp', 0o1777);
  fs.stat('/missions').mode = 0o755;
  fs.stat('/root').mode = 0o700;
  fs.stat('/var/log/workbench').mode = 0o755;
  for (const d of ['/home/player', '/home/player/Documents', '/home/player/Downloads', '/home/player/Projects', '/home/player/.cache', '/home/player/.ssh', '/home/player/Documents/assignments/2026/intake']) {
    fs.mkdir(d, ROOT, true);
    const n = fs.stat(d);
    n.uid = PLAYER_UID;
    n.gid = PLAYER_UID;
    n.mtime = T0;
  }
  fs.stat('/home/player').mode = 0o750;
  fs.stat('/home/player/.ssh').mode = 0o700;

  const files: SeedFile[] = [
    f('/home/player/notes.txt', 'Set up by the Lindgate desk. Your own notes go here.\n\nHouse rules:\n1. Work only inside the assignment.\n2. Report to NULL, nobody else.\n3. The workbench is ours. Treat it like a borrowed car.\n', { ...P }),
    f('/home/player/.bashrc', `# ~/.bashrc\nexport PS1="\\u@\\h:\\w\\$ "\nexport EDITOR=nano\nalias ll='ls -l'\n# gt-relayd keeps this box in touch with the desk. Leave it running.\n`, { ...P }),
    f('/home/player/.bash_history', `cd /missions\nls\ncurl -I http://portal.nexus-labs.test/\ncat /opt/relay/relay.conf\nwhoami\nsudo -l\ncat /var/log/workbench/audit.log\nsudo cat /var/log/workbench/audit.log\nsha256sum /opt/relay/relay.conf\nrm .notes_41\nhistory -c\n`, { ...P, mode: 0o600, mtime: Date.UTC(2025, 7, 21, 23, 41) }),
    f('/home/player/.cache/.notes_41', `if you are reading this they gave you my box.\nthe image gets reused. the desk thinks wiping home is enough.\n\nwhat i know:\n- check who pays. lindgate is not what it says it is.\n- the exercises are not exercises.\n- everything you type goes upstream. look in /var/log.\n\nthey call people like us c-numbers. i am c-0041.\nif you are smart, stop before the job with the portal.\nif you are smarter than me, do not stop, and keep copies.\n\n  - lowtide\n`, { ...P, mode: 0o600, mtime: Date.UTC(2025, 7, 21, 23, 39) }),
    f('/home/player/Documents/assignments/2026/intake/intake.txt', `LINDGATE ADVISORY - CONTRACTOR INTAKE\n\nWelcome. This workbench is an isolated training image. Every\nassignment is carried out here.\n\nYour relay settings are in /opt/relay/relay.conf. Read them, and\nconfirm your contractor reference to the desk.\n\nFile outstanding findings with the "submit" command.\n`, P),
    f('/home/player/Documents/assignments/2026/intake/old_draft.txt', `DRAFT - do not use\ncontractor reference: c-0000 (template)\nrelay: replace-me\n`, P),
    f('/home/player/Documents/readme.txt', `Assignments arrive under /missions/ when you accept them.\nman COMMAND explains anything you do not recognise.\n`, P),
    f('/home/player/Projects/.gitkeep', '', P),
    f('/opt/relay/relay.conf', `# gt-relayd configuration\n[identity]\ncontractor_ref = c-0047\nclient_profile = gt-workbench/1.4\n\n[upstream]\nhost = relay.blackwell.test\nport = 8443\nreconnect_seconds = 30\n\n[audit]\nship_commands = true\nlocal_copy = /var/log/workbench/audit.log\n`),
    f('/opt/relay/README', `gt-relayd: keeps contractor workbenches connected to the desk.\nDo not stop this service. See relay.conf.\n`),
    f('/etc/hostname', 'workbench\n'),
    f('/etc/passwd', `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nsyslog:x:104:110::/home/syslog:/usr/sbin/nologin\ngtrelay:x:998:998:gt-relayd:/opt/relay:/usr/sbin/nologin\nplayer:x:1000:1000::/home/player:/bin/bash\n`),
    f('/etc/group', `root:x:0:\nadm:x:4:syslog\ngtrelay:x:998:\nplayer:x:1000:\nlab:x:1001:player\n`),
    f('/etc/hosts', `127.0.0.1 localhost\n10.40.0.47 workbench workbench.lab.test\n10.40.0.1 gw.lab.test\n`),
    f('/etc/resolv.conf', `# lab resolver: answers for simulated lab and .test names only\nnameserver 10.40.0.1\nsearch lab.test\n`),
    f('/etc/os-release', `PRETTY_NAME="Workbench Linux 24.04 (lab image)"\nNAME="Workbench Linux"\nVERSION_ID="24.04"\n`),
    f('/etc/motd', `Lindgate Advisory contractor workbench.\nAuthorized use only. This system is monitored.\n`),
    f('/etc/sudoers.d/90-workbench', `# added for log rotation debugging, remove before shipping image\nplayer ALL=(root) NOPASSWD: /usr/bin/cat /var/log/workbench/*\n`, { mode: 0o440 }),
    f('/var/log/syslog', `Oct 12 21:02:03 workbench systemd[1]: Started gt-relayd.service.\nOct 12 21:02:04 workbench gt-relayd[811]: connected upstream relay.blackwell.test:8443\nOct 12 21:30:03 workbench CRON[1204]: (root) CMD (/opt/relay/ship-audit.sh)\n`, { uid: 104, gid: 4, mode: 0o640 }),
    f('/var/log/auth.log', `Oct 12 21:02:11 workbench sshd[902]: Server listening on 0.0.0.0 port 22.\nOct 12 21:47:02 workbench login[1277]: session opened for user player\n`, { uid: 104, gid: 4, mode: 0o640 }),
    f('/var/log/dmesg', `[    0.000000] Linux version 6.8.0-47-generic\n[    1.204417] wireguard: WireGuard 1.0.0 loaded.\n`),
    f('/var/log/workbench/audit.log', `# gt-relayd command audit. shipped upstream every 30 minutes.\n`, { mode: 0o600 }),
    f('/tmp/.X0-lock', '      811\n', { uid: PLAYER_UID, gid: PLAYER_UID }),
  ];
  for (const file of files) installFile(fs, file);
  for (const name of ['null', 'zero', 'random']) installFile(fs, { path: `/dev/${name}`, data: '', mode: 0o666 });
}

export const HOST_PROFILES = {
  workbench: {
    hostname: 'workbench',
    user: 'player',
    id: { uid: PLAYER_UID, gid: PLAYER_UID, groups: [PLAYER_UID, LAB_GID] },
    home: '/home/player',
    users: { 0: 'root', 104: 'syslog', 998: 'gtrelay', 1000: 'player' } as Record<number, string>,
    groups: { 0: 'root', 4: 'adm', 998: 'gtrelay', 1000: 'player', 1001: 'lab' } as Record<number, string>,
    sudoers: ['/usr/bin/cat /var/log/workbench/*'],
  },
};

export const PROCESSES: Record<string, { pid: number; user: string; cpu: number; mem: number; cmd: string; start: string }[]> = {
  workbench: [
    { pid: 1, user: 'root', cpu: 0, mem: 0.3, cmd: '/sbin/init', start: 'Oct12' },
    { pid: 412, user: 'root', cpu: 0, mem: 0.2, cmd: '/usr/sbin/cron -f', start: 'Oct12' },
    { pid: 620, user: 'syslog', cpu: 0, mem: 0.3, cmd: '/usr/sbin/rsyslogd -n', start: 'Oct12' },
    { pid: 811, user: 'gtrelay', cpu: 0.4, mem: 1.1, cmd: '/opt/relay/gt-relayd --conf /opt/relay/relay.conf', start: 'Oct12' },
    { pid: 902, user: 'root', cpu: 0, mem: 0.4, cmd: 'sshd: /usr/sbin/sshd -D', start: 'Oct12' },
    { pid: 1277, user: 'player', cpu: 0.1, mem: 0.3, cmd: '-bash', start: '21:47' },
  ],
};
