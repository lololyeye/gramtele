import { bindMission } from './bind';

export const M05 = bindMission({
  id: 'm05',
  chapter: 5,
  contact: 'ROOTLESS',
  difficulty: 4,
  minutes: 40,
  clock: '2026-10-24T02:20:00',
  tools: ['dossier'],
  files: [
    {
      host: 'workbench',
      file: {
        path: '/missions/m05/README',
      },
    },
  ],
  objectives: [
    {
      id: 'sudo',
      check: { kind: 'all', of: [{ kind: 'cmd', name: 'sudo', args: '-l' }, { kind: 'cmd', name: 'sudo', args: 'audit\\.log' }] },
      xp: 40,
      skill: 'fundamentals',
      effects: [{ flag: 'read_own_audit' }, { achievement: 'mirror' }, { journal: '', kind: 'finding' }],
    },
    {
      id: 'devices',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'gramtele_meta', match: 'sessions' }, { kind: 'answer', key: 'null_devices' }, { kind: 'answer', key: 'shared_device' }] },
      answer: { key: 'null_devices', accept: ['3', 'three', 'trois'] },
      extraAnswers: [{ key: 'shared_device', accept: ['d-90be'] }],
      xp: 60,
      skill: 'databases',
      effects: [{ flag: 'knows_null_devices' }, { flag: 'knows_vanta_device' }, { journal: '', kind: 'finding' }],
    },
    {
      id: 'contractors',
      check: { kind: 'all', of: [{ kind: 'sql', db: 'gramtele_meta', match: 'contractors', result: 'c-0047' }, { kind: 'answer', key: 'past_contractors' }, { kind: 'answer', key: 'closure_date' }] },
      answer: { key: 'past_contractors', accept: ['6', 'six'] },
      extraAnswers: [{ key: 'closure_date', accept: ['2026-11-05'] }],
      xp: 40,
      skill: 'databases',
      effects: [{ flag: 'knows_blackwell' }, { achievement: 'c_number' }],
    },
    {
      id: 'dossier',
      check: { kind: 'sealed' },
      xp: 80,
      skill: 'forensics',
    },
    {
      id: 'decide',
      check: { kind: 'signal', id: 'ending-chosen' },
      xp: 50,
      skill: 'fundamentals',
    },
  ],
  optionals: [
    {
      id: 'lowtide_row',
      check: { kind: 'http', host: 'archive.test', path: '/records/brask-note' },
      xp: 20,
      skill: 'osint',
    },
    {
      id: 'reik_style',
      check: { kind: 'http', host: 'orion-security.test', path: '/blog/write-it-down' },
      xp: 25,
      skill: 'osint',
      effects: [{ flag: 'knows_vanta_style' }],
    },
    {
      id: 'transparency',
      check: { kind: 'http', host: 'gramtele.test', path: '/transparency' },
      xp: 15,
      skill: 'osint',
    },
  ],
  rewards: { xp: 120, credits: 0, standing: 60 },
});
