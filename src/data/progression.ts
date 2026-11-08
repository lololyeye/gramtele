import type { Achievement, EndingId, EvidenceDef, GameState, SkillId, SkillNode } from '../game/types';
import { lineKey } from '../i18n';

export const SKILL_TITLES: Record<SkillId, string> = {
  linux: 'Linux',
  networking: 'Networking',
  osint: 'OSINT',
  databases: 'Databases',
  websec: 'Web Fundamentals',
  forensics: 'Digital Forensics',
  ir: 'Investigation Practice',
  fundamentals: 'Security Fundamentals',
};

export const SKILL_NODES: SkillNode[] = [
  { id: 'lx_nav', skill: 'linux', title: 'Finding your way', text: 'Moved around with cd, ls and pwd.', requires: [], check: { cmd: 'cd', times: 3 } },
  { id: 'lx_find', skill: 'linux', title: 'Stop guessing', text: 'Searched the tree with find.', requires: ['lx_nav'], check: { cmd: 'find' } },
  { id: 'lx_pipe', skill: 'linux', title: 'Pipelines', text: 'Chained two commands with a pipe.', requires: ['lx_nav'], check: { stages: 2 } },
  { id: 'lx_freq', skill: 'linux', title: 'Frequency analysis', text: 'Built a pipeline of three or more stages.', requires: ['lx_pipe'], check: { stages: 3 } },
  { id: 'lx_perm', skill: 'linux', title: 'Permissions', text: 'Changed a file mode with chmod.', requires: ['lx_nav'], check: { cmd: 'chmod' } },
  { id: 'lx_man', skill: 'linux', title: 'Read the manual', text: 'Consulted man pages.', requires: [], check: { cmd: 'man', times: 2 } },
  { id: 'os_search', skill: 'osint', title: 'Search operators', text: 'Used site:, filetype: or exact phrases.', requires: [], check: { signal: 'search-operator' } },
  { id: 'os_meta', skill: 'osint', title: 'Metadata', text: 'Read embedded metadata with exiftool.', requires: [], check: { cmd: 'exiftool' } },
  { id: 'os_collision', skill: 'osint', title: 'Handle collisions', text: 'Rejected a false username match.', requires: ['os_search'], check: { objective: 'm02.correlate' } },
  { id: 'os_whois', skill: 'osint', title: 'Check the claim', text: 'Tested a company\'s story with whois.', requires: [], check: { cmd: 'whois' } },
  { id: 'os_money', skill: 'osint', title: 'Follow the ownership', text: 'Traced ownership in a public registry.', requires: ['os_whois'], check: { optional: 'm04.registry' } },
  { id: 'db_schema', skill: 'databases', title: 'Read the schema', text: 'Inspected tables and keys.', requires: [], check: { objective: 'm03.schema' } },
  { id: 'db_join', skill: 'databases', title: 'JOIN', text: 'Combined tables on a key.', requires: ['db_schema'], check: { sql: '\\bjoin\\b' } },
  { id: 'db_group', skill: 'databases', title: 'Aggregation', text: 'Used GROUP BY.', requires: ['db_schema'], check: { sql: 'group\\s+by' } },
  { id: 'db_audit', skill: 'databases', title: 'Audit trails', text: 'Reconciled a table against its audit log.', requires: ['db_join'], check: { objective: 'm03.integrity' } },
  { id: 'nw_self', skill: 'networking', title: 'Know your position', text: 'Read your address and routes.', requires: [], check: { cmd: 'ip' } },
  { id: 'nw_dns', skill: 'networking', title: 'DNS', text: 'Queried DNS records.', requires: [], check: { cmd: 'dig', times: 2 } },
  { id: 'nw_scan', skill: 'networking', title: 'Service discovery', text: 'Identified services in the lab with nmap.', requires: ['nw_self'], check: { cmd: 'nmap' } },
  { id: 'nw_route', skill: 'networking', title: 'Routing', text: 'Compared routes with traceroute.', requires: ['nw_self'], check: { objective: 'm04.route' } },
  { id: 'ws_http', skill: 'websec', title: 'Raw HTTP', text: 'Read a server\'s headers with curl.', requires: [], check: { cmd: 'curl', args: '-I|-i|--head|--include' } },
  { id: 'ws_tls', skill: 'websec', title: 'Certificates', text: 'Read a certificate chain.', requires: ['ws_http'], check: { objective: 'm04.http' } },
  { id: 'fr_hash', skill: 'forensics', title: 'Hashes', text: 'Fingerprinted a file with SHA-256.', requires: [], check: { cmd: 'sha256sum' } },
  { id: 'fr_sign', skill: 'forensics', title: 'File signatures', text: 'Looked at the bytes with file or xxd.', requires: [], check: { cmd: 'file' } },
  { id: 'fr_encoding', skill: 'forensics', title: 'Encoding is not encryption', text: 'Decoded base64.', requires: [], check: { signal: 'cmd:base64-d' } },
  { id: 'fr_custody', skill: 'forensics', title: 'Chain of custody', text: 'Sealed a verifiable dossier.', requires: ['fr_hash'], check: { objective: 'm05.dossier' } },
  { id: 'ir_notes', skill: 'ir', title: 'Write it down', text: 'Kept notes in the journal.', requires: [], check: { cmd: 'note' } },
  { id: 'ir_timeline', skill: 'ir', title: 'Timelines', text: 'Reconstructed a timeline from independent sources.', requires: [], check: { objective: 'm02.report' } },
  { id: 'ir_limits', skill: 'ir', title: 'State your limits', text: 'Separated observation from conclusion in a report.', requires: ['ir_timeline'], check: { reportsFiled: 3 } },
  { id: 'sf_least', skill: 'fundamentals', title: 'Least privilege', text: 'Audited a sudo policy.', requires: [], check: { objective: 'm05.sudo' } },
  { id: 'sf_meta', skill: 'fundamentals', title: 'Metadata matters', text: 'Showed what session records reveal.', requires: [], check: { objective: 'm05.devices' } },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', title: 'Hello, machine', text: 'Ran your first command.' },
  { id: 'tenant', title: 'Previous tenant', text: 'Found what lowtide left behind.', hidden: true },
  { id: 'follow_money', title: 'Follow the ownership', text: 'Found Hollin Trust in the public registry.', hidden: true },
  { id: 'no_hints', title: 'Unassisted', text: 'Completed a mission without any hints.' },
  { id: 'flawless', title: 'Clean file', text: 'Filed a report with every section right first time.' },
  { id: 'explorer', title: 'Reads everything', text: 'Found every optional discovery in one mission.' },
  { id: 'pipeline', title: 'Plumber', text: 'Ran a pipeline with four or more stages.' },
  { id: 'mirror', title: 'Mirror', text: 'Read your own audit log.', hidden: true },
  { id: 'c_number', title: 'A date', text: 'Found your own closure date.', hidden: true },
  { id: 'receipts', title: 'Receipts', text: 'Opened the file before opening your mouth, in front of everyone.', hidden: true },
  { id: 'corrected', title: 'Compressing', text: 'Corrected MOTH in public.', hidden: true },
  { id: 'asked_null', title: 'Which one of you', text: 'Asked NULL the question nobody had asked in three years.', hidden: true },
  { id: 'all_endings_one', title: 'The end of the road', text: 'Reached an ending.' },
];

export const EVIDENCE: Record<string, EvidenceDef> = {
  'ridge-photo': { id: 'ridge-photo', title: 'Jetty photograph (GPS tagged)', summary: 'Posted by quietfern on 12 Apr 2026. EXIF gives coordinates at Harrowmere.', source: 'trailtalk.test', links: ['nexus-bulletin'] },
  'aldric-photo': { id: 'aldric-photo', title: 'Aldric ridge photograph', summary: 'Posted by quietfern in Aug 2021. No GPS tags.', source: 'trailtalk.test' },
  'nexus-bulletin': { id: 'nexus-bulletin', title: 'Nexus staff bulletin, Q3 2021', summary: 'Names Elin Maret with the handle quietfern. Author field: E. Maret.', source: 'nexus-labs.test', links: ['archive-db'] },
  'nexus-press': { id: 'nexus-press', title: 'Calvexin press release', summary: '"No treatment-related deaths were observed." Metadata Company field: Blackwell Diligence.', source: 'nexus-labs.test', exhibit: true, links: ['archive-db'] },
  'archive-db': { id: 'archive-db', title: 'Nexus archive database image', summary: 'Audit log records deletion of AE 2291-2293 by k.dressler. Invoices to Blackwell Diligence total 230,000.', source: 'Assignment m03', exhibit: true, links: ['nexus-press', 'registry-hollin'] },
  'registry-hollin': { id: 'registry-hollin', title: 'Registry record: Hollin Trust', summary: 'Controls Blackwell Holdings, Orion Security and Lindgate Advisory.', source: 'registry.test', exhibit: true, links: ['report-halden'] },
  'report-halden': { id: 'report-halden', title: 'Orion summary: Halden Freight', summary: 'Names contractor c-0031. Signed S. Reik.', source: 'orion-security.test', exhibit: true, links: ['gramtele-meta'] },
  'report-brask': { id: 'report-brask', title: 'Orion summary: Brask Utilities', summary: 'Names contractor c-0041. Signed S. Reik.', source: 'orion-security.test', links: ['gramtele-meta'] },
  'gramtele-meta': { id: 'gramtele-meta', title: 'Gramtele metadata export', summary: 'Three devices sign in as NULL. Contractor table lists six closures and your scheduled one.', source: 'Passed over Gramtele', exhibit: true },
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
