import { b64encode } from '../../game/commands/forensic';
import type { Beat, Cond, Effect, Msg, ThreadId } from '../../game/types';

/**
 * The whole conversation script. Beats fire when their condition becomes true.
 * Characters only refer to what they could know; see docs/STORY_BIBLE.md.
 */

const done = (id: string): Cond => ({ missionDone: id });
const flag = (f: string): Cond => ({ flag: f });
const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

/** Mission offer with a real decline: the price goes up, and the world notices. */
function offer(id: string, mission: string, thread: ThreadId, when: Cond, messages: Msg[], declineReply: string, reoffer: string, delay = 2500): Beat[] {
  return [
    {
      id: `${id}_offer`,
      thread,
      when,
      delay,
      messages,
      effects: [{ offer: mission }],
      choices: [
        { id: 'accept', label: 'Accept the assignment', reply: 'I will take it.', effects: [{ accept: mission }] },
        { id: 'decline', label: 'Decline for now', reply: 'Not this one.', effects: [{ flag: `${id}_declined` }, { standing: -2 }] },
      ],
    },
    {
      id: `${id}_reoffer`,
      thread,
      when: flag(`${id}_declined`),
      delay: 9000,
      messages: [{ text: declineReply }, { text: reoffer, invite: mission }],
      choices: [
        { id: 'accept', label: 'Accept the assignment', reply: 'Fine. Send it over.', effects: [{ accept: mission }, { credits: 10 }] },
      ],
    },
  ];
}

const FRAG1 = 'do you know what you looked for';
const FRAG2 = 'the woman on the jetty counted three deaths nobody filed';
const FRAG3 = 'if you have the image look at march twelve. then decide whose side your hands are on';

export const BEATS: Beat[] = [
  // ---------- Chapter 0 ----------
  {
    id: 'n0_hello',
    thread: 'NULL',
    when: flag('signed_up'),
    delay: 1500,
    messages: [
      { text: 'Good evening. You asked a good question in the open channel earlier: why an old DNS answer can outlive the record that produced it. Most people do not ask why.' },
      { text: 'I handle contract work for a small diligence firm. Paperwork, mostly. Checking that companies are who they say they are.' },
    ],
    choices: [
      { id: 'firm', label: 'Which firm?', effects: [{ flag: 'n0_talked' }, { flag: 'asked_firm' }], then: [{ text: 'Lindgate Advisory. You are welcome to look them up. I would think less of you if you did not.' }] },
      { id: 'how', label: 'How did you find me?', effects: [{ flag: 'n0_talked' }], then: [{ text: 'You asked a good question in public. That is usually how it happens.' }] },
      { id: 'work', label: 'What kind of work?', effects: [{ flag: 'n0_talked' }, { rel: ['NULL', 1] }], then: [{ text: 'Careful reading, mostly. Records, documents, configuration. Nobody has ever been hurt by careful reading.' }] },
    ],
  },
  ...offer(
    'n1',
    'm01',
    'NULL',
    flag('n0_talked'),
    [
      { text: 'A small paid test, if it interests you. Forty credits, an hour of your evening. We issue you a workbench, and you show me you can find your way around it.' },
      { text: 'Assignment attached.', invite: 'm01' },
    ],
    'Understood. People are often busy.',
    'The test stays open tonight, at fifty credits. I do not usually ask twice.',
  ),

  // ---------- Chapter 1 reactions ----------
  {
    id: 'lg_hello',
    thread: 'lowlight',
    when: { missionActive: 'm01' },
    delay: 20000,
    messages: [
      { from: 'sys', text: 'You were added to #lowlight by NULL.' },
      { from: 'kelpie', text: 'new handle. hello new handle' },
      { from: 'tinsel', text: 'rules: no names, no clients, no asking what anyone is paid' },
      { from: 'ostrich_farm', text: 'everyone asks what everyone is paid' },
    ],
  },
  {
    id: 'n1_done',
    thread: 'NULL',
    when: done('m01'),
    delay: 3000,
    messages: [
      { text: 'Received. Forty credits released. You read the live configuration rather than the draft beside it. Several people have not.' },
      { if: flag('read_notes41'), text: 'One housekeeping note. You will come across old files on that image from a previous contractor. They are not relevant, and I would leave them.' },
    ],
    effects: [{ flag: 'n1_closed' }],
  },
  {
    id: 'ltd_archive',
    thread: 'lowtide',
    when: flag('read_notes41'),
    delay: 6000,
    messages: [
      { from: 'sys', text: 'Conversation recovered from the workbench image. Account closed 22 Aug 2025. 11 Feb 2025:' },
      { from: 'NULL', text: 'Good evening. You asked a good question in the open channel earlier. Most people do not ask why.' },
      { from: 'lowtide', text: 'ha thanks. who is this' },
      { from: 'NULL', text: 'I handle contract work for a small diligence firm. Paperwork, mostly.' },
      { from: 'sys', text: '20 Aug 2025:' },
      { from: 'lowtide', text: 'there is a police report with my contractor number on it' },
      { from: 'lowtide', text: 'NULL' },
      { from: 'lowtide', text: 'answer me' },
      { from: 'sys', text: 'NULL has left this conversation.' },
    ],
    effects: [{ journal: 'An archived chat from lowtide opens with almost the same words NULL used on me. It ends with a police report.', kind: 'finding' }],
  },
  {
    id: 'v1_request',
    thread: 'VANTA',
    when: flag('n1_closed'),
    delay: 14000,
    contactRequest: true,
    messages: [
      { text: 'ok so someone in #lowlight says the new handle read a config file before asking about it. rare. hi.' },
      { text: 'I do security research, I answer questions when I feel like it. one rule. write it down.' },
    ],
    choices: [
      { id: 'yes', label: 'Accept contact request', reply: 'Hi. Write what down?', effects: [{ flag: 'vanta_contact' }, { rel: ['VANTA', 1] }], then: [{ text: 'everything. the command, the time, why you ran it. you will not remember. nobody does.' }] },
      { id: 'no', label: 'Ignore for now', reply: 'I do not know you.', effects: [{ flag: 'vanta_contact' }], then: [{ text: 'good answer honestly. offer stands.' }] },
    ],
  },

  // ---------- Chapter 2 ----------
  ...offer(
    'n2',
    'm02',
    'NULL',
    { all: [flag('n1_closed'), { beat: 'v1_request' }] },
    [
      { text: 'A proper assignment, if you have the evening. A client wishes to understand a former employee of one of its suppliers. All we hold is a handle.' },
      { text: 'Public sources only, and we never contact a subject. Eighty credits.', invite: 'm02' },
    ],
    'That is your right.',
    'Eighty credits became ninety on my side, since the client is pressing. Same terms.',
    16000,
  ),
  {
    id: 'v2_tip',
    thread: 'VANTA',
    when: { missionActive: 'm02' },
    delay: 45000,
    messages: [
      { text: 'heard you got a people job. ok so one thing. same handle on two sites is not the same person. people get ruined by that mistake.' },
      { text: 'ask of every fact: who says so, and what would it look like if they were wrong?' },
    ],
  },
  {
    id: 'm1_hello',
    thread: 'MOTH',
    when: { missionActive: 'm02' },
    delay: 90000,
    contactRequest: true,
    messages: [
      { text: 'hello c-0047... sorry, is that rude? you have a nice handle too, I just like numbers' },
      { text: 'you have been reading a walking forum all evening. lovely hobby. I am sure it is a hobby' },
    ],
    choices: [
      { id: 'how', label: 'How do you know that?', effects: [{ flag: 'moth_contact' }, { rel: ['MOTH', 1] }], then: [{ text: 'your relay and my relay are good friends... ask me again when you have something to trade' }] },
      { id: 'block', label: 'Leave me alone.', effects: [{ flag: 'moth_contact' }], then: [{ text: 'everyone says that first. it is fine. I am very patient, it is a job requirement' }] },
    ],
  },
  {
    id: 'n2_done_gave',
    thread: 'NULL',
    when: { all: [done('m02'), flag('gave_location')] },
    delay: 3000,
    messages: [{ text: 'Very thorough, and a bonus has been released for the location. The client is pleased. You need think no more about this subject.' }],
    effects: [{ flag: 'n2_closed' }],
  },
  {
    id: 'n2_done_withheld',
    thread: 'NULL',
    when: { all: [done('m02'), flag('withheld_location')] },
    delay: 3000,
    messages: [
      { text: 'Received. Name and employment, and no location. It seems unlike you to find so little.' },
      { text: 'No matter. Payment released.' },
    ],
    effects: [{ flag: 'n2_closed' }],
  },
  {
    id: 'e1_fragment',
    thread: 'ECHO',
    when: flag('n2_closed'),
    delay: 22000,
    messages: [{ text: b64encode(FRAG1), attachment: { name: 'fragment_01.txt', kind: 'text', preview: b64encode(FRAG1), file: { path: '/home/player/Downloads/fragment_01.txt', data: b64encode(FRAG1) + '\n', uid: 1000 } } }],
    choices: [
      { id: 'decoded', label: 'I know now. Who are you?', if: { signal: 'cmd:base64-d' }, effects: [{ flag: 'e1_answered' }, { rel: ['ECHO', 1] }], then: [{ text: 'Encoding is not secrecy. You passed.' }] },
      { id: 'what', label: 'What is this supposed to be?', effects: [{ flag: 'e1_answered' }], then: [{ text: 'bWFuIGJhc2U2NA==' }] },
    ],
  },
  {
    id: 'e1_gave',
    thread: 'ECHO',
    when: { all: [flag('e1_answered'), flag('gave_location')] },
    delay: 12000,
    messages: [
      { text: 'A man walked down the jetty road on Tuesday, asking in the shop about a woman who hikes.' },
      { text: 'I do not live there any more. I had a garden.' },
    ],
    effects: [{ rel: ['ECHO', -2] }, { journal: 'ECHO has fled Harrowmere because someone came asking. I gave them the town.', kind: 'story' }],
  },
  {
    id: 'e1_withheld',
    thread: 'ECHO',
    when: { all: [flag('e1_answered'), flag('withheld_location')] },
    delay: 12000,
    messages: [
      { text: 'A profile I keep an eye on was read closely, photo and all. Then nobody came. Somebody knew, and did not say.' },
      { text: 'I would like to know why. I do not expect an answer yet.' },
    ],
    effects: [{ rel: ['ECHO', 2] }],
  },

  // ---------- Chapter 3 ----------
  ...offer(
    'n3',
    'm03',
    'NULL',
    flag('e1_answered'),
    [
      { text: 'Your next assignment is narrow. A client wants assurance on vendor payments in a decommissioned database. An image is ready for you.' },
      { text: 'The scope is the invoices. One hundred and twenty credits.', invite: 'm03' },
    ],
    'As you prefer.',
    'I can stretch to one hundred and thirty. It is an easy evening, and it is only invoices.',
    20000,
  ),
  {
    id: 'lg_db',
    thread: 'lowlight',
    when: { missionActive: 'm03' },
    delay: 50000,
    messages: [
      { from: 'kelpie', text: 'anyone else get paid to read a dead database this year' },
      { from: 'tinsel', text: 'no clients' },
      { from: 'kelpie', text: 'i said anyone, i did not say a client' },
      { from: 'ostrich_farm', text: 'remember unfurl? always had the fun jobs. then stopped posting in february' },
      { from: 'tinsel', text: 'people move on' },
    ],
  },
  {
    id: 'e2_fragment',
    thread: 'ECHO',
    when: { missionActive: 'm03' },
    delay: 60000,
    messages: [{ text: rot13(FRAG2), attachment: { name: 'fragment_02.txt', kind: 'text', preview: rot13(FRAG2), file: { path: '/home/player/Downloads/fragment_02.txt', data: rot13(FRAG2) + '\n', uid: 1000 } } }, { text: rot13('tr a-z n-za-m') }],
  },
  {
    id: 'v3_ask',
    thread: 'VANTA',
    when: done('m03'),
    delay: 15000,
    messages: [{ text: 'you sound quiet. database jobs do that. did you find something outside scope? you can tell me. I keep good notes, as you know.' }],
    choices: [
      { id: 'share', label: 'Tell VANTA about the deleted events', reply: 'Three adverse events were deleted the night before a big invoice. Two were deaths.', decision: 'You told VANTA about the deleted adverse events.', effects: [{ flag: 'shared_archive_vanta' }, { rel: ['VANTA', 2] }, { flag: 'v3_done' }], then: [{ text: 'ok. that is real. did you hash the image? hash the image. and be careful who else you say that to.' }] },
      { id: 'keep', label: 'Keep it to yourself', reply: 'Nothing worth mentioning. Just invoices.', decision: 'You told nobody what the archive contained.', effects: [{ flag: 'kept_archive' }, { flag: 'v3_done' }], then: [{ text: 'mm. ok. notes, though. even if they are only for you.' }] },
    ],
  },
  {
    id: 'n3_done',
    thread: 'NULL',
    when: flag('v3_done'),
    delay: 6000,
    messages: [
      { text: 'Your invoice figures reached the client. Thank you. Payment released.' },
      { if: flag('shared_archive_vanta'), text: 'You need not trouble yourself with the deleted entries. They were outside your scope.' },
    ],
    choices: [
      { id: 'confront', label: 'What happened to those patients?', decision: 'You challenged NULL about the patients in NX-417.', effects: [{ flag: 'confronted_null' }, { rel: ['NULL', -3] }, { standing: -5 }, { flag: 'n3_closed' }], then: [{ text: 'Patients? I asked you about invoices.' }, { text: 'Your work remains excellent. I would keep it that way.' }] },
      { id: 'noticed', label: 'I never told you about any deleted entries.', if: flag('shared_archive_vanta'), reply: 'I never told you about any deleted entries.', decision: 'You noticed NULL knew something you had only told VANTA.', effects: [{ flag: 'noticed_leak' }, { rel: ['NULL', -1] }, { rel: ['VANTA', -1] }, { flag: 'n3_closed' }, { journal: 'NULL mentioned the deleted entries. I had told only VANTA.', kind: 'finding' }], then: [{ text: 'You queried the audit table on our workbench. We do read our own logs.' }] },
      { id: 'quiet', label: 'Say nothing', reply: 'Understood.', effects: [{ flag: 'n3_closed' }, { rel: ['NULL', 1] }] },
    ],
  },
  {
    id: 'e3_fragment',
    thread: 'ECHO',
    when: flag('n3_closed'),
    delay: 25000,
    messages: [{ text: hex(FRAG3), attachment: { name: 'fragment_03.txt', kind: 'text', preview: hex(FRAG3), file: { path: '/home/player/Downloads/fragment_03.txt', data: hex(FRAG3) + '\n', uid: 1000 } } }],
  },

  // ---------- Chapter 4 ----------
  ...offer(
    'n4',
    'm04',
    'NULL',
    flag('n3_closed'),
    [
      { text: 'The client would now like an outside view of the same supplier: what anyone could see of its network from public information. It is all simulated within your lab environment.' },
      { text: 'One hundred and fifty credits.', invite: 'm04' },
    ],
    'Noted.',
    'I will hold it for you at one hundred and sixty. After this there is a larger job, and I would like you ready for it.',
    30000,
  ),
  {
    id: 'r1_hello',
    thread: 'ROOTLESS',
    when: { missionActive: 'm04' },
    delay: 70000,
    contactRequest: true,
    messages: [
      { text: 'you dont know me - nobody does anymore thats the point of me' },
      { text: 'c-0031 - i had your box before the guy who had your box - ask them what happened to halden freight' },
    ],
    choices: [
      { id: 'yes', label: 'What happened at Halden Freight?', effects: [{ flag: 'rootless_contact' }, { rel: ['ROOTLESS', 1] }], then: [{ text: 'read the report - orion-security.test/reports - my number is on it - i was home that night - judge did not care' }] },
      { id: 'no', label: 'Why should I trust you?', effects: [{ flag: 'rootless_contact' }], then: [{ text: 'you shouldnt - check me - archive.test has the appeal bundle - check everything thats what they trained you to do - funny that' }] },
    ],
  },
  {
    id: 'm2_watch',
    thread: 'MOTH',
    when: { any: [{ optionalDone: ['m02', 'lindgate'] }, { optionalDone: ['m04', 'registry'] }] },
    delay: 30000,
    messages: [{ text: 'you looked up who owns your employer... good. they saw, of course. your workbench tells them everything... did nobody mention?' }],
    effects: [{ flag: 'knows_moth_staff' }],
  },
  {
    id: 'n4_done',
    thread: 'NULL',
    when: done('m04'),
    delay: 4000,
    messages: [
      { text: 'A clear map, and well separated from opinion. Payment released.' },
      { text: 'The next job is larger and pays two thousand. Details follow once you confirm. It concerns that same portal. Take a day.' },
    ],
    effects: [{ flag: 'next_job_offered' }],
  },

  // ---------- Finale ----------
  ...offer(
    'r2',
    'm05',
    'ROOTLESS',
    flag('next_job_offered'),
    [
      { text: 'they offered you the big job right - round number - portal - thats the one - thats where they stop paying and start writing reports' },
      { text: 'dont answer them yet - lowtide said it in that note - keep copies - i put a folder on your box - relay goes both ways if you know how to ask - moth owes me', invite: 'm05' },
    ],
    'ok - you want to be sure - everyone does',
    'but the date doesnt move because you need a day',
    12000,
  ),
  {
    id: 'mt_trade',
    thread: 'MOTH',
    when: { missionActive: 'm05' },
    delay: 9000,
    messages: [
      { text: 'so... I have a little export. session records, device ids, the thing our transparency page says does not exist. it would answer a lot of your questions' },
      { text: 'and you have someone who sends you hex at dawn. I would like to know which relay she is on. only that. a fair trade, one set of metadata for another' },
    ],
    choices: [
      { id: 'give', label: 'Give MOTH what you know about ECHO', reply: 'Her handle is ECHO. She connects around dawn. Send the file.', decision: 'You traded ECHO\'s connection pattern to MOTH for the export.', effects: [{ flag: 'gave_echo_to_moth' }, { flag: 'has_export' }, { rel: ['ECHO', -3] }, { rel: ['MOTH', 2] }], then: [{ text: 'pleasure... I do mean that', attachment: { name: 'gramtele_meta.db', kind: 'file', preview: 'SQLite database, session metadata export. Save it and open it with sqlite3.', file: { path: '/home/player/Downloads/gramtele_meta.db', db: 'gramtele_meta', tag: 'gramtele-meta', uid: 1000, mode: 0o444 } } }] },
      { id: 'refuse', label: 'Refuse', reply: 'No. Not her.', decision: 'You refused to trade ECHO to MOTH.', effects: [{ flag: 'refused_moth' }, { rel: ['MOTH', -1] }, { rel: ['ECHO', 1] }], then: [{ text: 'principled... that usually costs someone. we will talk' }] },
    ],
  },
  {
    id: 'r3_export',
    thread: 'ROOTLESS',
    when: flag('refused_moth'),
    delay: 15000,
    messages: [
      { text: 'moth asked for her didnt it - you said no - good - moth also sold me this last year for less than youd think - old format same tables - updated it myself', attachment: { name: 'gramtele_meta.db', kind: 'file', preview: 'SQLite database, session metadata export. Save it and open it with sqlite3.', file: { path: '/home/player/Downloads/gramtele_meta.db', db: 'gramtele_meta', tag: 'gramtele-meta', uid: 1000, mode: 0o444 } } },
    ],
    effects: [{ flag: 'has_export' }, { rel: ['ROOTLESS', 2] }],
  },
  {
    id: 'v4_confront',
    thread: 'VANTA',
    when: flag('knows_vanta_device'),
    delay: 8000,
    messages: [
      { text: 'you ran a group by on the sessions table. saw it come through.' },
      { text: 'ok so. yes. d-90be is my laptop. I run recruits. I taught six people to take notes and then I wrote the reports with their numbers on them.' },
      { text: 'I have also been looking for a seventh who would read their own audit log before they had to. you did. nobody else has.' },
    ],
    choices: [
      { id: 'believe', label: 'Why should I believe a word of that?', decision: 'You demanded VANTA justify herself.', effects: [{ flag: 'v4_done' }], then: [{ text: 'you should not. check it. I signed Halden and Brask, my name is on the PDFs. if you publish, I go first. I have made my peace with the order.' }] },
      { id: 'cut', label: 'You did this to six people.', decision: 'You told VANTA there was nothing she could say.', effects: [{ flag: 'v4_done' }, { rel: ['VANTA', -3] }], then: [{ text: 'yes.' }] },
      { id: 'help', label: 'Then help me. Delay the closure.', decision: 'You asked VANTA for help, knowing who she is.', effects: [{ flag: 'v4_done' }, { flag: 'vanta_helps' }, { rel: ['VANTA', 2] }], then: [{ text: 'I can lose a form for a week. maybe. that is all I have ever been able to do, lose forms.' }] },
    ],
  },
  {
    id: 'e4_plain',
    thread: 'ECHO',
    when: { all: [{ missionActive: 'm05' }, { signal: 'dossier-sealed' }] },
    delay: 6000,
    messages: [
      { if: { not: flag('gave_echo_to_moth') }, text: 'I am told you have assembled the record. My name is Elin Maret. I kept the audit export for nineteen months, and I have not found anyone who would read it.' },
      { if: flag('gave_echo_to_moth'), text: 'My relay was probed this morning. I know how that happened, and I know you have the record. My name is Elin Maret. I have very little left to protect.' },
      { text: 'Two families have never been told how those people died. If this is published, I am the witness, and I will be found. If it is given to me, I go to the regulator myself, in my own time. That choice was taken from me once.' },
    ],
    effects: [{ flag: 'knows_echo_elin' }],
    choices: [
      { id: 'custody', label: 'Send the dossier to ECHO', reply: 'It is yours. Sending the sealed dossier now.', decision: 'You gave the dossier to Elin Maret and let her decide.', effects: [{ ending: 'custody' }] },
      { id: 'wait', keep: true, label: 'Not yet', reply: 'Give me a little longer.', then: [{ text: 'I have become good at that.' }] },
    ],
  },
  {
    id: 'mt_buy',
    thread: 'MOTH',
    when: { all: [{ missionActive: 'm05' }, { signal: 'dossier-sealed' }] },
    delay: 15000,
    messages: [{ text: 'a sealed dossier! publishing is so final... give it to me instead. I hold it over them, they fund a new life for two people, nobody goes to prison, nobody gets found. the world stays exactly as bad, but we are out of it' }],
    choices: [
      { id: 'sell', label: 'Hand the dossier to MOTH', reply: 'Take it. Get me out.', decision: 'You sold the dossier to MOTH for leverage.', effects: [{ ending: 'leverage' }] },
      { id: 'no', keep: true, label: 'No deal', reply: 'No.', then: [{ text: 'the offer ages badly, like everything' }] },
    ],
  },
  {
    id: 'n5_final',
    thread: 'NULL',
    when: { all: [{ missionActive: 'm05' }, flag('read_own_audit')] },
    delay: 5000,
    messages: [
      { text: 'You have read a file you were not asked to read. I expected you would, eventually. People of your ability do.' },
      { text: 'Your position is simple. Take the next contract and you move to our side of the desk: a salary, a new handle, and the number on that closure date becomes someone else\'s. Or do not, and I cannot help you.' },
    ],
    choices: [
      { id: 'seat', label: 'Take the contract', reply: 'What do you need me to sign?', decision: 'You took the seat at NULL\'s desk.', effects: [{ ending: 'seat' }] },
      { id: 'ghost', label: 'Close your account and disappear', reply: 'Close my account.', decision: 'You closed the account and walked away with nothing said.', effects: [{ ending: 'ghost' }] },
      { id: 'later', keep: true, label: 'Do not answer yet', reply: 'I need to think.', then: [{ text: 'Of course. The date is the date.' }] },
    ],
  },
];

/** Effects that fire on world events rather than on a conversation. */
export const WORLD_RULES: { when: Cond; effects: Effect[]; id: string }[] = [
  { id: 'archive_ending', when: { all: [{ signal: 'archive-submission' }, { missionActive: 'm05' }] }, effects: [{ ending: 'record' }] },
];
