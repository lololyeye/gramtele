import { bindMission } from './bind';

const ISO = (d: string) => Date.parse(`${d}Z`);

export const M01 = bindMission({
  id: 'm01',
  chapter: 1,
  contact: 'NULL',
  difficulty: 1,
  minutes: 15,
  clock: '2026-10-12T22:05:00',
  tools: [],
  files: [
    {
      host: 'workbench',
      file: {
        path: '/missions/m01/brief.txt',
        mtime: ISO('2026-10-12T22:00:00'),
      },
    },
  ],
  objectives: [
    {
      id: 'identity',
      check: { kind: 'all', of: [{ kind: 'any', of: [{ kind: 'cmd', name: 'id' }, { kind: 'cmd', name: 'whoami' }] }, { kind: 'answer', key: 'uid' }] },
      answer: { key: 'uid', accept: ['1000'] },
      xp: 15,
      skill: 'linux',
    },
    {
      id: 'navigate',
      check: { kind: 'all', of: [{ kind: 'cwd', path: '/missions/m01' }, { kind: 'cmd', name: 'ls' }] },
      xp: 15,
      skill: 'linux',
    },
    {
      id: 'find',
      check: { kind: 'all', of: [{ kind: 'cmd', name: 'find', args: 'intake' }, { kind: 'read', path: '/home/player/Documents/assignments/2026/intake/intake.txt' }] },
      xp: 25,
      skill: 'linux',
    },
    {
      id: 'config',
      check: { kind: 'all', of: [{ kind: 'read', path: '/opt/relay/relay.conf' }, { kind: 'answer', key: 'contractor_ref' }, { kind: 'answer', key: 'upstream' }] },
      answer: { key: 'contractor_ref', accept: ['c-0047'] },
      extraAnswers: [{ key: 'upstream', accept: ['relay.blackwell.test'] }],
      xp: 30,
      skill: 'linux',
    },
    {
      id: 'receipt',
      check: { kind: 'file', path: '/home/player/cases/m01/receipt.txt', contains: 'c-0047' },
      xp: 25,
      skill: 'linux',
    },
  ],
  optionals: [
    {
      id: 'notes41',
      check: { kind: 'read', path: '/home/player/.cache/.notes_41' },
      xp: 30,
      skill: 'forensics',
      effects: [{ flag: 'read_notes41' }, { achievement: 'tenant' }, { journal: '', kind: 'finding' }],
    },
    {
      id: 'history41',
      check: { kind: 'read', path: '/home/player/.bash_history' },
      xp: 15,
      skill: 'forensics',
      effects: [{ flag: 'read_history41' }],
    },
    {
      id: 'relayproc',
      check: { kind: 'pipeline', stages: ['ps', 'grep'] },
      xp: 15,
      skill: 'linux',
    },
  ],
  rewards: { xp: 40, credits: 40, standing: 40 },
});

export const M02 = bindMission({
  id: 'm02',
  chapter: 2,
  contact: 'NULL',
  difficulty: 2,
  minutes: 30,
  clock: '2026-10-14T20:30:00',
  tools: ['osint', 'forensics'],
  files: [
    {
      host: 'workbench',
      file: {
        path: '/missions/m02/brief.txt',
        mtime: ISO('2026-10-14T20:25:00'),
      },
    },
  ],
  objectives: [
    {
      id: 'search',
      check: { kind: 'all', of: [{ kind: 'http', host: 'search.test', path: '/search' }, { kind: 'http', host: 'trailtalk.test', path: '/u/quietfern' }, { kind: 'http', host: 'gamersden.test', path: '/u/quietfern' }] },
      xp: 25,
      skill: 'osint',
    },
    {
      id: 'correlate',
      check: { kind: 'answer', key: 'false_profile' },
      answer: { key: 'false_profile', accept: ['gamersden.test', 'gamersden'] },
      xp: 30,
      skill: 'osint',
    },
    {
      id: 'name',
      check: { kind: 'all', of: [{ kind: 'cmd', name: 'exiftool', args: 'pdf' }, { kind: 'answer', key: 'real_name' }] },
      answer: { key: 'real_name', accept: ['elin maret', 'e. maret', 'e maret', 'maret'] },
      xp: 45,
      skill: 'osint',
    },
    {
      id: 'employment',
      check: { kind: 'all', of: [{ kind: 'http', host: 'folio.test', path: '/elin.maret' }, { kind: 'http', host: 'trailtalk.test', path: '/t/hiatus' }, { kind: 'answer', key: 'left_employer' }] },
      answer: { key: 'left_employer', accept: ['2025-03', '2025-03-28', 'march 2025', 'mar 2025', 'mars 2025', 'mar. 2025', '03/2025', '03-2025'] },
      xp: 30,
      skill: 'osint',
    },
    {
      id: 'location',
      check: { kind: 'all', of: [{ kind: 'cmd', name: 'exiftool', args: 'jpg' }, { kind: 'http', host: 'maps.test', path: '/lookup' }, { kind: 'answer', key: 'town' }, { kind: 'evidence', id: 'ridge-photo' }] },
      answer: { key: 'town', accept: ['harrowmere'] },
      xp: 50,
      skill: 'forensics',
    },
    {
      id: 'report',
      check: { kind: 'report' },
      xp: 60,
      skill: 'osint',
    },
  ],
  optionals: [
    {
      id: 'operator',
      check: { kind: 'signal', id: 'search-operator' },
      xp: 15,
      skill: 'osint',
    },
    {
      id: 'lindgate',
      check: { kind: 'probe', probe: 'whois', target: 'lindgate.test' },
      xp: 30,
      skill: 'osint',
      effects: [{ flag: 'whois_lindgate' }, { journal: '', kind: 'finding' }],
    },
    {
      id: 'aldric',
      check: { kind: 'cmd', name: 'exiftool', args: 'aldric' },
      xp: 15,
      skill: 'forensics',
    },
  ],
  report: {
    passMark: 0.67,
    sections: [
      {
        kind: 'order',
        id: 'timeline',
        items: [
          { id: 'return' },
          { id: 'bulletin' },
          { id: 'photo' },
          { id: 'left' },
        ],
        correct: ['bulletin', 'left', 'return', 'photo'],
      },
      {
        kind: 'choice',
        id: 'reliability',
        options: [
          { id: 'same-name' },
          { id: 'independent', correct: true },
          { id: 'exif-only' },
        ],
      },
      {
        kind: 'choice',
        id: 'limits',
        options: [
          { id: 'certain' },
          { id: 'indicative', correct: true },
          { id: 'none' },
        ],
      },
      {
        kind: 'decision',
        id: 'handover',
        options: [
          { id: 'full', effects: [{ flag: 'gave_location' }, { rel: ['NULL', 2] }, { standing: 5 }, { credits: 20 }] },
          { id: 'withhold', effects: [{ flag: 'withheld_location' }, { rel: ['NULL', -1] }] },
        ],
      },
    ],
  },
  rewards: { xp: 60, credits: 80, standing: 110 },
});

export const M03 = bindMission({
  id: 'm03',
  chapter: 3,
  contact: 'NULL',
  difficulty: 2,
  minutes: 35,
  clock: '2026-10-17T21:15:00',
  tools: ['db'],
  files: [
    { host: 'workbench', file: { path: '/missions/m03/nexus_archive.db', mode: 0o444, db: 'nexus_archive', tag: 'archive-db', mtime: Date.UTC(2025, 3, 30, 3, 12) } },
    {
      host: 'workbench',
      file: {
        path: '/missions/m03/brief.txt',
        mtime: ISO('2026-10-17T21:10:00'),
      },
    },
  ],
  objectives: [
    {
      id: 'tables',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'nexus_archive', match: 'sqlite_master|\\.tables' }, { kind: 'answer', key: 'table_count' }] },
      answer: { key: 'table_count', accept: ['8', 'eight', 'huit'] },
      xp: 20,
      skill: 'databases',
    },
    {
      id: 'schema',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'nexus_archive', match: 'sql FROM sqlite_master|\\.schema' }, { kind: 'answer', key: 'fk_column' }] },
      answer: { key: 'fk_column', accept: ['vendor_id', 'invoices.vendor_id'] },
      xp: 25,
      skill: 'databases',
    },
    {
      id: 'vendors',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'nexus_archive', match: 'join[\\s\\S]*(sum|group)|(sum|group)[\\s\\S]*join', result: '230000' }, { kind: 'answer', key: 'vendor_total' }] },
      answer: { key: 'vendor_total', accept: ['230000', '230000.0', '230,000', '230000.00'] },
      xp: 40,
      skill: 'databases',
    },
    {
      id: 'approver',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'nexus_archive', match: 'staff', result: 'k.dressler' }, { kind: 'answer', key: 'approver' }] },
      answer: { key: 'approver', accept: ['k.dressler', 'konrad dressler', 'dressler'] },
      xp: 30,
      skill: 'databases',
    },
    {
      id: 'audit',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'nexus_archive', match: 'audit_log', result: '2291' }, { kind: 'answer', key: 'deleted_count' }] },
      answer: { key: 'deleted_count', accept: ['3', 'three', 'trois'] },
      xp: 45,
      skill: 'databases',
    },
    {
      id: 'integrity',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'nexus_archive', result: 'FATAL' }, { kind: 'sql', db: 'nexus_archive', match: 'submissions' }, { kind: 'answer', key: 'fatal_count' }] },
      answer: { key: 'fatal_count', accept: ['2', 'two', 'deux'] },
      xp: 50,
      skill: 'databases',
    },
    {
      id: 'report',
      check: { kind: 'report' },
      xp: 40,
      skill: 'databases',
    },
  ],
  optionals: [
    {
      id: 'collect',
      check: { kind: 'evidence', id: 'archive-db' },
      xp: 20,
      skill: 'forensics',
    },
    {
      id: 'maret',
      check: { kind: 'sql', db: 'nexus_archive', result: 'ACCESS_REVOKED' },
      xp: 40,
      skill: 'databases',
      effects: [{ flag: 'saw_maret_export' }, { journal: '', kind: 'finding' }],
    },
    {
      id: 'readonly',
      check: { kind: 'signal', id: 'sql-readonly-refused' },
      xp: 10,
      skill: 'forensics',
    },
  ],
  report: {
    passMark: 0.67,
    sections: [
      {
        kind: 'choice',
        id: 'why-audit',
        options: [
          { id: 'hidden' },
          { id: 'gone', correct: true },
          { id: 'perm' },
        ],
      },
      {
        kind: 'choice',
        id: 'relationship',
        options: [
          { id: 'true' },
          { id: 'consistent', correct: true },
        ],
      },
      {
        kind: 'choice',
        id: 'control',
        options: [
          { id: 'mfa' },
          { id: 'sod', correct: true },
          { id: 'backup' },
        ],
      },
    ],
  },
  rewards: { xp: 80, credits: 120, standing: 140 },
});

export const M04 = bindMission({
  id: 'm04',
  chapter: 4,
  contact: 'NULL',
  difficulty: 3,
  minutes: 35,
  clock: '2026-10-20T22:10:00',
  tools: ['net'],
  files: [
    {
      host: 'workbench',
      file: {
        path: '/missions/m04/brief.txt',
        mtime: ISO('2026-10-20T22:05:00'),
      },
    },
  ],
  objectives: [
    {
      id: 'self',
      check: { kind: 'all', of: [{ kind: 'cmd', name: 'ip', args: 'r' }, { kind: 'probe', probe: 'nmap', target: '10.40.0.0/24' }, { kind: 'answer', key: 'gateway' }, { kind: 'answer', key: 'lab_hosts' }] },
      answer: { key: 'gateway', accept: ['10.40.0.1'] },
      extraAnswers: [{ key: 'lab_hosts', accept: ['4', 'four', 'quatre'] }],
      xp: 35,
      skill: 'networking',
    },
    {
      id: 'dns',
      check: { kind: 'all', of: [{ kind: 'dns', name: 'nexus-labs.test', type: 'A' }, { kind: 'dns', name: 'archive-01.nexus-labs.test' }, { kind: 'answer', key: 'nexus_ip' }, { kind: 'answer', key: 'archive_alias' }] },
      answer: { key: 'archive_alias', accept: ['relay.blackwell.test', 'relay.blackwell.test.'] },
      extraAnswers: [{ key: 'nexus_ip', accept: ['192.0.2.40'] }],
      xp: 40,
      skill: 'networking',
    },
    {
      id: 'records',
      check: { kind: 'all', of: [{ kind: 'dns', name: 'nexus-labs.test', type: 'NS' }, { kind: 'dns', name: 'nexus-labs.test', type: 'TXT' }, { kind: 'answer', key: 'dns_operator' }] },
      answer: { key: 'dns_operator', accept: ['orion-security.test', 'orion security', 'orion'] },
      xp: 30,
      skill: 'networking',
    },
    {
      id: 'scan',
      check: { kind: 'all', of: [{ kind: 'probe', probe: 'nmap', target: 'portal.nexus-labs.test' }, { kind: 'cmd', name: 'nmap', args: '-sV' }, { kind: 'answer', key: 'debug_port' }] },
      answer: { key: 'debug_port', accept: ['8080', '8080/tcp'] },
      xp: 35,
      skill: 'networking',
    },
    {
      id: 'http',
      check: { kind: 'all', of: [{ kind: 'http', host: 'portal.nexus-labs.test', via: 'curl' }, { kind: 'cmd', name: 'curl', args: '(^| )-\\w*v|--verbose' }, { kind: 'answer', key: 'cert_issuer' }] },
      answer: { key: 'cert_issuer', accept: ['orion security', 'orion security internal ca', 'orion'] },
      xp: 30,
      skill: 'websec',
    },
    {
      id: 'route',
      check: { kind: 'all', of: [{ kind: 'probe', probe: 'traceroute', target: 'nexus-labs.test' }, { kind: 'probe', probe: 'traceroute', target: 'blackwell.test' }, { kind: 'answer', key: 'shared_hop' }] },
      answer: { key: 'shared_hop', accept: ['gw.orion-security.test', 'gw.orion-security.test.'] },
      xp: 35,
      skill: 'networking',
    },
    {
      id: 'report',
      check: { kind: 'report' },
      xp: 45,
      skill: 'networking',
    },
  ],
  optionals: [
    {
      id: 'robots',
      check: { kind: 'http', host: 'nexus-labs.test', path: '/robots.txt' },
      xp: 15,
      skill: 'websec',
    },
    {
      id: 'reverse',
      check: { kind: 'dns', name: '23.113.0.203.in-addr.arpa' },
      xp: 25,
      skill: 'networking',
      effects: [{ flag: 'ptr_lindgate' }, { journal: '', kind: 'finding' }],
    },
    {
      id: 'registry',
      check: { kind: 'http', host: 'registry.test', path: '/company/hollin-trust' },
      xp: 40,
      skill: 'osint',
      effects: [{ flag: 'knows_lindgate_shell' }, { flag: 'knows_hollin' }, { journal: '', kind: 'finding' }, { achievement: 'follow_money' }],
    },
    {
      id: 'own_socket',
      check: { kind: 'cmd', name: 'ss' },
      xp: 15,
      skill: 'networking',
    },
  ],
  report: {
    passMark: 0.67,
    sections: [
      {
        kind: 'choice',
        id: 'filtered',
        options: [
          { id: 'closed' },
          { id: 'filtered', correct: true },
          { id: 'open' },
        ],
      },
      {
        kind: 'choice',
        id: 'tcpudp',
        options: [
          { id: 'speed', correct: true },
          { id: 'secure' },
          { id: 'ports' },
        ],
      },
      {
        kind: 'choice',
        id: 'architecture',
        options: [
          { id: 'independent' },
          { id: 'orion', correct: true },
          { id: 'owned' },
        ],
      },
    ],
  },
  rewards: { xp: 90, credits: 150, standing: 170 },
  onComplete: [],
});
