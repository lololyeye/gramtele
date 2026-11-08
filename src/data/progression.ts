import type { Achievement, EndingId, EvidenceDef, GameState, SkillId, SkillNode } from '../game/types';
import { lineKey } from '../i18n';
import { textKey } from './missions/bind';

const SKILL_IDS: SkillId[] = ['linux', 'networking', 'osint', 'databases', 'websec', 'forensics', 'ir', 'fundamentals'];
export const SKILL_TITLES = Object.fromEntries(SKILL_IDS.map((id) => [id, textKey(`skills.${id}`)])) as Record<SkillId, string>;

const NODES: Omit<SkillNode, 'title' | 'text'>[] = [
  { id: 'lx_nav', skill: 'linux', requires: [], check: { cmd: 'cd', times: 3 } },
  { id: 'lx_find', skill: 'linux', requires: ['lx_nav'], check: { cmd: 'find' } },
  { id: 'lx_pipe', skill: 'linux', requires: ['lx_nav'], check: { stages: 2 } },
  { id: 'lx_freq', skill: 'linux', requires: ['lx_pipe'], check: { stages: 3 } },
  { id: 'lx_perm', skill: 'linux', requires: ['lx_nav'], check: { cmd: 'chmod' } },
  { id: 'lx_man', skill: 'linux', requires: [], check: { cmd: 'man', times: 2 } },
  { id: 'os_search', skill: 'osint', requires: [], check: { signal: 'search-operator' } },
  { id: 'os_meta', skill: 'osint', requires: [], check: { cmd: 'exiftool' } },
  { id: 'os_collision', skill: 'osint', requires: ['os_search'], check: { objective: 'm02.correlate' } },
  { id: 'os_whois', skill: 'osint', requires: [], check: { cmd: 'whois' } },
  { id: 'os_money', skill: 'osint', requires: ['os_whois'], check: { optional: 'm04.registry' } },
  { id: 'db_schema', skill: 'databases', requires: [], check: { objective: 'm03.schema' } },
  { id: 'db_join', skill: 'databases', requires: ['db_schema'], check: { sql: '\\bjoin\\b' } },
  { id: 'db_group', skill: 'databases', requires: ['db_schema'], check: { sql: 'group\\s+by' } },
  { id: 'db_audit', skill: 'databases', requires: ['db_join'], check: { objective: 'm03.integrity' } },
  { id: 'nw_self', skill: 'networking', requires: [], check: { cmd: 'ip' } },
  { id: 'nw_dns', skill: 'networking', requires: [], check: { cmd: 'dig', times: 2 } },
  { id: 'nw_scan', skill: 'networking', requires: ['nw_self'], check: { cmd: 'nmap' } },
  { id: 'nw_route', skill: 'networking', requires: ['nw_self'], check: { objective: 'm04.route' } },
  { id: 'ws_http', skill: 'websec', requires: [], check: { cmd: 'curl', args: '-I|-i|--head|--include' } },
  { id: 'ws_tls', skill: 'websec', requires: ['ws_http'], check: { objective: 'm04.http' } },
  { id: 'fr_hash', skill: 'forensics', requires: [], check: { cmd: 'sha256sum' } },
  { id: 'fr_sign', skill: 'forensics', requires: [], check: { cmd: 'file' } },
  { id: 'fr_encoding', skill: 'forensics', requires: [], check: { signal: 'cmd:base64-d' } },
  { id: 'fr_custody', skill: 'forensics', requires: ['fr_hash'], check: { objective: 'm05.dossier' } },
  { id: 'ir_notes', skill: 'ir', requires: [], check: { cmd: 'note' } },
  { id: 'ir_timeline', skill: 'ir', requires: [], check: { objective: 'm02.report' } },
  { id: 'ir_limits', skill: 'ir', requires: ['ir_timeline'], check: { reportsFiled: 3 } },
  { id: 'sf_least', skill: 'fundamentals', requires: [], check: { objective: 'm05.sudo' } },
  { id: 'sf_meta', skill: 'fundamentals', requires: [], check: { objective: 'm05.devices' } },
];

export const SKILL_NODES: SkillNode[] = NODES.map((n) => ({ ...n, title: textKey(`nodes.${n.id}.title`), text: textKey(`nodes.${n.id}.text`) }));

const ACHIEVEMENT_LOGIC: Omit<Achievement, 'title' | 'text'>[] = [
  { id: 'first_blood' },
  { id: 'tenant', hidden: true },
  { id: 'follow_money', hidden: true },
  { id: 'no_hints' },
  { id: 'flawless' },
  { id: 'explorer' },
  { id: 'pipeline' },
  { id: 'mirror', hidden: true },
  { id: 'c_number', hidden: true },
  { id: 'receipts', hidden: true },
  { id: 'corrected', hidden: true },
  { id: 'asked_null', hidden: true },
  { id: 'all_endings_one' },
];

export const ACHIEVEMENTS: Achievement[] = ACHIEVEMENT_LOGIC.map((a) => ({ ...a, title: textKey(`achievements.${a.id}.title`), text: textKey(`achievements.${a.id}.text`) }));

const evidenceText = (id: string) => ({ title: textKey(`evidence.${id}.title`), summary: textKey(`evidence.${id}.summary`) });

export const EVIDENCE: Record<string, EvidenceDef> = {
  'ridge-photo': { id: 'ridge-photo', ...evidenceText('ridge-photo'), source: 'trailtalk.test', links: ['nexus-bulletin'] },
  'aldric-photo': { id: 'aldric-photo', ...evidenceText('aldric-photo'), source: 'trailtalk.test' },
  'nexus-bulletin': { id: 'nexus-bulletin', ...evidenceText('nexus-bulletin'), source: 'nexus-labs.test', links: ['archive-db'] },
  'nexus-press': { id: 'nexus-press', ...evidenceText('nexus-press'), source: 'nexus-labs.test', exhibit: true, links: ['archive-db'] },
  'archive-db': { id: 'archive-db', ...evidenceText('archive-db'), source: textKey('evidence.archive-db.source'), exhibit: true, links: ['nexus-press', 'registry-hollin'] },
  'registry-hollin': { id: 'registry-hollin', ...evidenceText('registry-hollin'), source: 'registry.test', exhibit: true, links: ['report-halden'] },
  'report-halden': { id: 'report-halden', ...evidenceText('report-halden'), source: 'orion-security.test', exhibit: true, links: ['gramtele-meta'] },
  'report-brask': { id: 'report-brask', ...evidenceText('report-brask'), source: 'orion-security.test', links: ['gramtele-meta'] },
  'gramtele-meta': { id: 'gramtele-meta', ...evidenceText('gramtele-meta'), source: textKey('evidence.gramtele-meta.source'), exhibit: true },
};

interface EndingText {
  title: string;
  epigraph: string;
  paragraphs: (s: GameState) => string[];
}

const end = (id: EndingId) => ({
  title: lineKey(`end.${id}.title`),
  epigraph: lineKey(`end.${id}.epigraph`),
});
const p = (id: EndingId, key: string) => lineKey(`end.${id}.p.${key}`);
/** How the scene remembers you. Only people it had heard of get a line. */
const known = (s: GameState) => (s.standing ?? 0) >= 300;

export const ENDINGS: Record<EndingId, EndingText> = {
  record: {
    ...end('record'),
    paragraphs: (s) => [
      p('record', 'read'),
      p('record', 'fallout'),
      p('record', s.flags.gave_location || s.flags.gave_echo_to_moth ? 'elin_hurt' : 'elin_safe'),
      p('record', s.flags.vanta_helps ? 'vanta_helped' : 'vanta_not'),
      ...(known(s) ? [p('record', 'coda')] : []),
      p('record', 'after'),
    ],
  },
  custody: {
    ...end('custody'),
    paragraphs: (s) => [
      p('custody', 'sent'),
      p('custody', 'weeks'),
      p('custody', s.flags.gave_location || s.flags.gave_echo_to_moth ? 'hurt' : 'safe'),
      p('custody', 'slow'),
      p('custody', s.flags.vanta_helps ? 'vanta_helped' : 'vanta_not'),
      ...(known(s) ? [p('custody', 'coda')] : []),
    ],
  },
  leverage: {
    ...end('leverage'),
    paragraphs: (s) => [
      p('leverage', 'offer'),
      p('leverage', 'nothing'),
      p('leverage', s.flags.gave_echo_to_moth ? 'gave' : 'kept'),
      ...(known(s) ? [p('leverage', 'coda')] : []),
      p('leverage', 'favour'),
    ],
  },
  seat: {
    ...end('seat'),
    paragraphs: (s) => [
      p('seat', 'contract'),
      p('seat', 'date'),
      p('seat', s.flags.read_notes41 ? 'note' : 'nonote'),
      p('seat', 'coda'),
      p('seat', 'evening'),
      p('seat', 'line'),
    ],
  },
  ghost: {
    ...end('ghost'),
    paragraphs: (s) => [
      p('ghost', 'closed'),
      p('ghost', 'date'),
      p('ghost', s.flags.sealed_kept ? 'kept' : 'nothing'),
      ...(known(s) ? [p('ghost', 'coda')] : []),
      p('ghost', 'note'),
    ],
  },
};
