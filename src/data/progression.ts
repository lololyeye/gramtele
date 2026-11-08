import type { Achievement, EndingId, EvidenceDef, GameState, SkillId, SkillNode } from '../game/types';

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

export const ENDINGS: Record<EndingId, EndingText> = {
  record: {
    title: 'The Open Record',
    epigraph: 'Public records belong to the public.',
    paragraphs: (s) => [
      'Maud Ferreira read your dossier that night and every hash matched. She published eleven days later, with the private names redacted and the audit rows in full.',
      'Nexus Labs issued a statement, then a second one. The regulator opened a file on NX-417. Two families received letters that should have been written in 2025.',
      s.flags.gave_location || s.flags.gave_echo_to_moth
        ? 'Elin Maret did not see it. By then she had moved twice more because of things you had already handed over, and when the Archive wrote to her, the relay she had used for a year was silent. Your dossier made her a witness, and you know who made her easy to find.'
        : 'Elin Maret was named as the source by a newspaper within the month, against her wishes. She gave evidence anyway, in a plain, exact voice, and went back to somewhere with a lake.',
      s.flags.vanta_helps
        ? 'Your closure form went missing for nine days, which was long enough. Sanna Reik resigned from Orion before anyone asked her to, and gave a statement that spared nobody, herself included.'
        : 'Orion\'s summary with your number on it was filed on 5 November, one week too late to be believed. It still took two lawyers and most of a year to make it go away.',
      'Gramtele lost a third of its handles in a week. The rest stayed. It was still the easiest place to find someone who would ask a good question.',
    ],
  },
  custody: {
    title: 'Custody',
    epigraph: 'That choice was taken from me once.',
    paragraphs: (s) => [
      'You sent the sealed dossier to a relay that answered at dawn. Then you waited, which you were bad at.',
      'Elin Maret took seven weeks. She found a lawyer who did not flinch and a regulator\'s inspector who had already been uneasy about day 40 of dosing. She went in on a Tuesday, under her own name, with her own export and your hashes.',
      s.flags.gave_location || s.flags.gave_echo_to_moth
        ? 'She never said she forgave you for what you handed over earlier. Her last message said only: "Received. Verified." You understood it was the most she could give, and more than you had a right to.'
        : 'Her last message to you was one line of base64. You decoded it by hand, for the pleasure of it. It said: thank you for leaving it out.',
      'It did not become a scandal. It became a slow inquiry, a withdrawn licence and a quiet settlement. Blackwell is still in business, under another name, and you still check who owns things.',
      s.flags.vanta_helps ? 'Your closure form went missing, and nobody ever filed a report with your number on it. You do not know whom to thank, and you would not.' : 'A report with your number on it did appear. It took a long time to be shown to be false. Your hashes helped.',
    ],
  },
  leverage: {
    title: 'Leverage',
    epigraph: 'The world stays exactly as bad, but we are out of it.',
    paragraphs: (s) => [
      'MOTH was as good as the offer. Within a month there was no closure date, no report and no workbench. A new identity arrived by post, with a bank account that had enough in it to be insulting.',
      'Nobody went to prison. NX-417 stayed filed. Calvexin was licensed the following spring, and you read the press release, and then you stopped reading press releases.',
      s.flags.gave_echo_to_moth
        ? 'You had given MOTH Elin\'s pattern too. One morning you checked her relay, for no reason, and it was gone. You will never know if that was her choice.'
        : 'Elin Maret kept her copy of the audit export. Somewhere, she is still looking for someone who will read it. You could write to her. You have thought about it.',
      'Six months later a message arrived on an account nobody should have known about. "still holding", it said, with a moth. "only a small favour." You have started to understand how the people at that desk began.',
    ],
  },
  seat: {
    title: 'The Seat',
    epigraph: 'You asked a good question in the open channel.',
    paragraphs: (s) => [
      'The contract was two pages long. The salary was real. They gave you a new device, and on the first of the month you were added to a rota. You were good at it. They had taught you well.',
      'The closure date on your row was changed to someone else\'s. You did not look up whose.',
      s.flags.read_notes41 ? 'You are the one who wiped the home directory on the old workbench image. You checked for hidden files first. You found the note, and you kept it, and you do not know why.' : 'Somebody wiped the home directory on your old workbench image. It went back into the pool.',
      'It is a quiet evening. A new handle has asked something sharp in the open channel, about why a cached answer outlives its record. You open a conversation. You are not {handle} any more. You type the way you were taught: correct punctuation, no hurry.',
      '"Good evening. You asked a good question. Most people do not ask why."',
    ],
  },
  ghost: {
    title: 'Ghost',
    epigraph: 'Standing is the only thing a handle owns.',
    paragraphs: (s) => [
      'You closed the account. You wiped what you could, and you were honest with yourself about how much that was. You took the bus somewhere you had never been, and for a while you checked every car.',
      'Your closure date came and went. A report appeared with your contractor number on it, and it named no one, because no one had ever known your name. Anonymity turned out to be good for exactly one thing.',
      s.flags.sealed_kept ? 'You still have a sealed archive on a drive in a drawer.' : 'You kept nothing, which felt like wisdom at the time.',
      'NX-417 stayed filed. Somewhere, a new contractor is reading a note in a hidden file, written by somebody who went further than you did. You did not leave one. You think about that more than you expected.',
    ],
  },
};
