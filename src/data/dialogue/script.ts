import { b64encode } from '../../game/commands/forensic';
import type { Attachment, Beat, Choice, Cond, Effect, JournalKind, Msg, ThreadId } from '../../game/types';
import { lineKey } from '../../i18n';
import { FRAGMENTS, KELPIE_INVOICE } from './fragments';

/**
 * The conversations as logic only: who speaks, when, and what each choice changes.
 * There is not a word of dialogue in this file. Every text lives in en.ts and fr.ts, under
 * the key this file gives it, so that both languages share one story and no sentences.
 * Characters only refer to what they could know; see docs/STORY_BIBLE.md.
 */

type RawEffect = Exclude<Effect, { journal: string }> | { journal: true; kind?: JournalKind };
type RawMsg = Omit<Msg, 'text'>;
interface RawChoice {
  id: string;
  if?: Cond;
  effects?: RawEffect[];
  then?: RawMsg[];
  keep?: boolean;
  decision?: true;
}
interface RawBeat extends Omit<Beat, 'messages' | 'choices' | 'effects'> {
  messages: RawMsg[];
  choices?: RawChoice[];
  effects?: RawEffect[];
}

const done = (id: string): Cond => ({ missionDone: id });
const active = (id: string): Cond => ({ missionActive: id });
const flag = (f: string): Cond => ({ flag: f });
const from = (who: Msg['from'], extra: Partial<RawMsg> = {}): RawMsg => ({ from: who, ...extra });
const when = (c: Cond, who?: Msg['from']): RawMsg => ({ if: c, ...(who ? { from: who } : {}) });
const hex = (s: string) => [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

function textFile(name: string, data: string): Attachment {
  return { name, kind: 'text', preview: data, file: { path: `/home/player/Downloads/${name}`, data: `${data}\n`, uid: 1000 } };
}

const exportFile = (): Attachment => ({
  name: 'gramtele_meta.db',
  kind: 'file',
  preview: lineKey('misc.export_preview'),
  file: { path: '/home/player/Downloads/gramtele_meta.db', db: 'gramtele_meta', tag: 'gramtele-meta', uid: 1000, mode: 0o444 },
});

const ENCODED = { one: b64encode(FRAGMENTS.en[0]), two: rot13(FRAGMENTS.en[1]), three: hex(FRAGMENTS.en[2]), invoice: b64encode(KELPIE_INVOICE.en) };
const INVOICE_PATH = '/home/player/Downloads/kelpie_invoice.b64';

/** Mission offer with a real decline: the price goes up, and the world notices. */
function offer(id: string, mission: string, thread: ThreadId, cond: Cond, messages: RawMsg[], delay = 2500): RawBeat[] {
  return [
    {
      id: `${id}_offer`,
      thread,
      when: cond,
      delay,
      messages,
      effects: [{ offer: mission }],
      choices: [
        { id: 'accept', effects: [{ accept: mission }] },
        { id: 'decline', effects: [{ flag: `${id}_declined` }, { standing: -10 }] },
      ],
    },
    {
      id: `${id}_reoffer`,
      thread,
      when: flag(`${id}_declined`),
      delay: 9000,
      messages: [{}, { invite: mission }],
      choices: [{ id: 'accept', effects: [{ accept: mission }, { credits: 10 }] }],
    },
  ];
}

const RAW_BEATS: RawBeat[] = [
  // ---------- Chapter 0 ----------
  {
    id: 'n0_hello',
    thread: 'NULL',
    when: flag('signed_up'),
    delay: 1500,
    messages: [{}, {}],
    choices: [
      { id: 'firm', effects: [{ flag: 'n0_talked' }, { flag: 'asked_firm' }], then: [{}] },
      { id: 'how', effects: [{ flag: 'n0_talked' }], then: [{}] },
      { id: 'work', effects: [{ flag: 'n0_talked' }, { rel: ['NULL', 1] }], then: [{}] },
    ],
  },
  ...offer('n1', 'm01', 'NULL', flag('n0_talked'), [{}, { invite: 'm01' }]),

  // ---------- Chapter 1: the scene meets the player ----------
  {
    id: 'lg_hello',
    thread: 'lowlight',
    when: active('m01'),
    delay: 20000,
    expires: true,
    messages: [from('sys'), from('tinsel'), from('ostrich_farm'), from('kelpie'), from('ROOTLESS')],
    choices: [
      { id: 'back', effects: [{ rel: ['ROOTLESS', 1] }], then: [from('ROOTLESS'), from('kelpie')] },
      { id: 'short', then: [from('kelpie'), from('tinsel')] },
    ],
  },
  {
    id: 'lg_fails',
    social: true,
    thread: 'lowlight',
    when: { all: [active('m01'), { stat: ['failed', 4] }] },
    delay: 4000,
    messages: [from('NULL'), from('NULL'), from('kelpie'), from('tinsel'), from('NULL')],
  },
  {
    id: 'lg_hints',
    social: true,
    thread: 'lowlight',
    when: { all: [active('m01'), { stat: ['hintsUsed', 1] }] },
    delay: 15000,
    messages: [from('MOTH'), from('ROOTLESS'), from('tinsel')],
  },
  {
    id: 'n1_done',
    thread: 'NULL',
    when: done('m01'),
    delay: 3000,
    messages: [{}, when(flag('clean:m01')), when(flag('hinted:m01')), when(flag('read_notes41'))],
    effects: [{ flag: 'n1_closed' }],
  },
  {
    id: 'lg_m1',
    social: true,
    thread: 'lowlight',
    when: done('m01'),
    delay: 9000,
    messages: [from('ostrich_farm'), when(flag('clean:m01'), 'ostrich_farm'), when(flag('clean:m01'), 'tinsel'), from('kelpie'), from('ROOTLESS'), from('kelpie')],
  },
  {
    id: 'ltd_archive',
    thread: 'lowtide',
    when: flag('read_notes41'),
    delay: 6000,
    messages: [from('sys'), from('NULL'), from('lowtide'), from('NULL'), from('sys'), from('lowtide'), from('lowtide'), from('lowtide'), from('sys')],
    effects: [{ journal: true, kind: 'finding' }],
  },
  {
    id: 'v1_request',
    thread: 'VANTA',
    when: flag('n1_closed'),
    delay: 14000,
    contactRequest: true,
    messages: [{}, {}],
    choices: [
      { id: 'yes', effects: [{ flag: 'vanta_contact' }, { rel: ['VANTA', 1] }], then: [{}] },
      { id: 'no', effects: [{ flag: 'vanta_contact' }], then: [{}] },
    ],
  },

  // ---------- Chapter 2: somebody wanted that job ----------
  ...offer('n2', 'm02', 'NULL', { all: [flag('n1_closed'), { beat: 'v1_request' }] }, [{}, { invite: 'm02' }], 16000),
  {
    id: 'v2_tip',
    thread: 'VANTA',
    when: active('m02'),
    delay: 45000,
    messages: [{}, {}],
  },
  {
    id: 'lg_kelpie_flex',
    social: true,
    thread: 'lowlight',
    when: active('m02'),
    delay: 30000,
    messages: [from('kelpie'), from('kelpie'), from('VANTA'), from('kelpie'), from('ostrich_farm'), from('ROOTLESS'), from('tinsel'), from('VANTA')],
  },
  {
    id: 'm1_hello',
    thread: 'MOTH',
    when: active('m02'),
    delay: 90000,
    contactRequest: true,
    messages: [{}, {}],
    choices: [
      { id: 'how', effects: [{ flag: 'moth_contact' }, { rel: ['MOTH', 1] }], then: [{}] },
      { id: 'block', effects: [{ flag: 'moth_contact' }], then: [{}] },
    ],
  },
  {
    id: 'n2_done_gave',
    thread: 'NULL',
    when: { all: [done('m02'), flag('gave_location')] },
    delay: 3000,
    messages: [{}],
    effects: [{ flag: 'n2_closed' }],
  },
  {
    id: 'n2_done_withheld',
    thread: 'NULL',
    when: { all: [done('m02'), flag('withheld_location')] },
    delay: 3000,
    messages: [{}, {}],
    effects: [{ flag: 'n2_closed' }],
  },
  {
    id: 'lg_m2',
    social: true,
    thread: 'lowlight',
    when: done('m02'),
    delay: 12000,
    messages: [when(flag('passed:ostrich_farm'), 'ostrich_farm'), from('kelpie'), from('tinsel'), from('ROOTLESS')],
  },
  {
    id: 'lg_duel',
    social: true,
    thread: 'lowlight',
    when: flag('n2_closed'),
    delay: 45000,
    expires: true,
    messages: [from('kelpie', { attachment: textFile('kelpie_invoice.b64', ENCODED.invoice) }), from('MOTH'), from('ostrich_farm')],
    choices: [
      {
        id: 'expose',
        if: { all: [{ signal: 'cmd:base64-d' }, { read: INVOICE_PATH }] },
        effects: [{ flag: 'mogged_kelpie' }, { standing: 40 }, { rel: ['VANTA', 1] }, { achievement: 'receipts' }],
        then: [from('kelpie'), from('ostrich_farm'), from('ROOTLESS'), from('tinsel'), from('VANTA')],
      },
      { id: 'pass', then: [from('kelpie'), from('ostrich_farm')] },
    ],
  },
  {
    id: 'e1_fragment',
    thread: 'ECHO',
    when: flag('n2_closed'),
    delay: 22000,
    messages: [{ attachment: textFile('fragment_01.txt', ENCODED.one) }],
    choices: [
      { id: 'decoded', if: { signal: 'cmd:base64-d' }, effects: [{ flag: 'e1_answered' }, { rel: ['ECHO', 1] }], then: [{}] },
      { id: 'what', effects: [{ flag: 'e1_answered' }], then: [{}] },
    ],
  },
  {
    id: 'lg_echo',
    social: true,
    thread: 'lowlight',
    when: flag('e1_answered'),
    delay: 30000,
    messages: [from('ostrich_farm'), from('MOTH'), from('tinsel'), from('kelpie'), from('VANTA')],
  },
  {
    id: 'e1_gave',
    thread: 'ECHO',
    when: { all: [flag('e1_answered'), flag('gave_location')] },
    delay: 12000,
    messages: [{}, {}],
    effects: [{ rel: ['ECHO', -2] }, { journal: true, kind: 'story' }],
  },
  {
    id: 'e1_withheld',
    thread: 'ECHO',
    when: { all: [flag('e1_answered'), flag('withheld_location')] },
    delay: 12000,
    messages: [{}, {}],
    effects: [{ rel: ['ECHO', 2] }],
  },

  // ---------- Chapter 3: the name starts to travel ----------
  ...offer('n3', 'm03', 'NULL', flag('e1_answered'), [{}, { invite: 'm03' }], 20000),
  {
    id: 'lg_db',
    thread: 'lowlight',
    when: active('m03'),
    delay: 50000,
    messages: [from('kelpie'), from('tinsel'), from('kelpie'), from('ostrich_farm'), from('tinsel'), from('ROOTLESS')],
  },
  {
    id: 'lg_group_by',
    social: true,
    thread: 'lowlight',
    when: { objectiveDone: ['m03', 'vendors'] },
    delay: 8000,
    expires: true,
    messages: [from('MOTH'), from('kelpie')],
    choices: [
      { id: 'wrong', effects: [{ standing: -5 }], then: [from('MOTH'), from('ROOTLESS')] },
      { id: 'right', effects: [{ flag: 'answered_group_by' }, { standing: 15 }, { rel: ['MOTH', 1] }], then: [from('MOTH'), from('kelpie'), from('ostrich_farm')] },
    ],
  },
  {
    id: 'lg_kelpie_asks',
    social: true,
    thread: 'lowlight',
    when: { all: [flag('mogged_kelpie'), { missionActive: 'm03' }] },
    delay: 70000,
    messages: [from('kelpie'), from('tinsel'), from('kelpie')],
  },
  {
    id: 'lg_passed_kelpie',
    social: true,
    thread: 'lowlight',
    when: flag('passed:kelpie'),
    delay: 6000,
    expires: true,
    messages: [from('ostrich_farm'), from('kelpie'), from('MOTH')],
    choices: [
      { id: 'gloat', effects: [{ standing: 10 }], then: [from('kelpie'), from('ROOTLESS')] },
      { id: 'gracious', then: [from('tinsel')] },
    ],
  },
  {
    id: 'e2_fragment',
    thread: 'ECHO',
    when: active('m03'),
    delay: 60000,
    messages: [{ attachment: textFile('fragment_02.txt', ENCODED.two) }, {}],
  },
  {
    id: 'v3_ask',
    thread: 'VANTA',
    when: done('m03'),
    delay: 15000,
    messages: [{}],
    choices: [
      { id: 'share', decision: true, effects: [{ flag: 'shared_archive_vanta' }, { rel: ['VANTA', 2] }, { flag: 'v3_done' }], then: [{}] },
      { id: 'keep', decision: true, effects: [{ flag: 'kept_archive' }, { flag: 'v3_done' }], then: [{}] },
    ],
  },
  {
    id: 'n3_done',
    thread: 'NULL',
    when: flag('v3_done'),
    delay: 6000,
    messages: [{}, when(flag('flawless:m03')), when(flag('shared_archive_vanta'))],
    choices: [
      { id: 'confront', decision: true, effects: [{ flag: 'confronted_null' }, { rel: ['NULL', -3] }, { standing: -25 }, { flag: 'n3_closed' }], then: [{}, {}] },
      { id: 'noticed', decision: true, if: flag('shared_archive_vanta'), effects: [{ flag: 'noticed_leak' }, { rel: ['NULL', -1] }, { rel: ['VANTA', -1] }, { flag: 'n3_closed' }, { journal: true, kind: 'finding' }], then: [{}] },
      { id: 'quiet', effects: [{ flag: 'n3_closed' }, { rel: ['NULL', 1] }] },
    ],
  },
  {
    id: 'lg_m3',
    social: true,
    thread: 'lowlight',
    when: done('m03'),
    delay: 25000,
    messages: [when(flag('passed:tinsel'), 'ostrich_farm'), when(flag('passed:tinsel'), 'tinsel'), when(flag('passed:tinsel'), 'ROOTLESS'), from('NULL')],
  },
  {
    id: 'v_respect',
    social: true,
    thread: 'VANTA',
    when: { all: [flag('vanta_contact'), { standing: 300 }] },
    delay: 20000,
    messages: [{}, {}],
  },
  {
    id: 'e3_fragment',
    thread: 'ECHO',
    when: flag('n3_closed'),
    delay: 25000,
    messages: [{ attachment: textFile('fragment_03.txt', ENCODED.three) }],
  },

  // ---------- Chapter 4: rivals ----------
  ...offer('n4', 'm04', 'NULL', flag('n3_closed'), [{}, { invite: 'm04' }], 30000),
  {
    id: 'lg_race',
    social: true,
    thread: 'lowlight',
    when: active('m04'),
    delay: 15000,
    messages: [from('ROOTLESS'), from('ROOTLESS'), from('kelpie'), from('ostrich_farm')],
  },
  {
    id: 'lg_race_won',
    social: true,
    thread: 'lowlight',
    when: { all: [{ beat: 'lg_race' }, { objectiveDone: ['m04', 'self'] }] },
    delay: 3000,
    messages: [from('ROOTLESS'), from('ROOTLESS'), from('ostrich_farm'), from('ROOTLESS')],
    effects: [{ standing: 15 }, { credits: 5 }],
  },
  {
    id: 'r1_hello',
    thread: 'ROOTLESS',
    when: active('m04'),
    delay: 70000,
    contactRequest: true,
    messages: [{}, {}],
    choices: [
      { id: 'yes', effects: [{ flag: 'rootless_contact' }, { rel: ['ROOTLESS', 1] }], then: [{}] },
      { id: 'no', effects: [{ flag: 'rootless_contact' }], then: [{}] },
    ],
  },
  {
    id: 'lg_ttl',
    social: true,
    thread: 'lowlight',
    when: { objectiveDone: ['m04', 'dns'] },
    delay: 10000,
    expires: true,
    messages: [from('MOTH'), from('ROOTLESS')],
    choices: [
      { id: 'agree', effects: [{ standing: -5 }], then: [from('MOTH'), from('tinsel')] },
      { id: 'ttl', effects: [{ flag: 'corrected_moth' }, { standing: 30 }, { rel: ['MOTH', 1] }, { achievement: 'corrected' }], then: [from('ostrich_farm'), from('MOTH'), from('ROOTLESS'), from('MOTH')] },
    ],
  },
  {
    id: 'm2_watch',
    thread: 'MOTH',
    when: { any: [{ optionalDone: ['m02', 'lindgate'] }, { optionalDone: ['m04', 'registry'] }] },
    delay: 30000,
    messages: [{}],
    effects: [{ flag: 'knows_moth_staff' }],
  },
  {
    id: 'n4_done',
    thread: 'NULL',
    when: done('m04'),
    delay: 4000,
    messages: [{}, when(flag('clean:m04')), {}],
    effects: [{ flag: 'next_job_offered' }],
  },
  {
    id: 'lg_m4',
    social: true,
    thread: 'lowlight',
    when: done('m04'),
    delay: 14000,
    messages: [
      when(flag('passed:MOTH'), 'ostrich_farm'),
      when(flag('passed:MOTH'), 'MOTH'),
      when(flag('passed:MOTH'), 'ROOTLESS'),
      when(flag('passed:MOTH'), 'MOTH'),
      when({ not: flag('passed:MOTH') }, 'ostrich_farm'),
      from('tinsel'),
      from('ostrich_farm'),
      from('VANTA'),
    ],
  },

  // ---------- Finale ----------
  ...offer('r2', 'm05', 'ROOTLESS', flag('next_job_offered'), [{}, { invite: 'm05' }], 12000),
  {
    id: 'r_table',
    social: true,
    thread: 'ROOTLESS',
    when: { all: [flag('rootless_contact'), { standing: 300 }, active('m05')] },
    delay: 30000,
    messages: [{}, {}],
  },
  {
    id: 'mt_trade',
    thread: 'MOTH',
    when: active('m05'),
    delay: 9000,
    messages: [{}, {}],
    choices: [
      { id: 'give', decision: true, effects: [{ flag: 'gave_echo_to_moth' }, { flag: 'has_export' }, { rel: ['ECHO', -3] }, { rel: ['MOTH', 2] }], then: [{ attachment: exportFile() }] },
      { id: 'refuse', decision: true, effects: [{ flag: 'refused_moth' }, { rel: ['MOTH', -1] }, { rel: ['ECHO', 1] }], then: [{}] },
    ],
  },
  {
    id: 'mt_weight',
    social: true,
    thread: 'MOTH',
    when: { all: [{ any: [flag('refused_moth'), flag('gave_echo_to_moth')] }, { standing: 300 }] },
    delay: 40000,
    messages: [{}],
  },
  {
    id: 'r3_export',
    thread: 'ROOTLESS',
    when: flag('refused_moth'),
    delay: 15000,
    messages: [{ attachment: exportFile() }],
    effects: [{ flag: 'has_export' }, { rel: ['ROOTLESS', 2] }],
  },
  {
    id: 'v4_confront',
    thread: 'VANTA',
    when: flag('knows_vanta_device'),
    delay: 8000,
    messages: [{}, {}, {}],
    choices: [
      { id: 'believe', decision: true, effects: [{ flag: 'v4_done' }], then: [{}] },
      { id: 'cut', decision: true, effects: [{ flag: 'v4_done' }, { rel: ['VANTA', -3] }], then: [{}] },
      { id: 'help', decision: true, effects: [{ flag: 'v4_done' }, { flag: 'vanta_helps' }, { rel: ['VANTA', 2] }], then: [{}] },
    ],
  },
  {
    id: 'e4_plain',
    thread: 'ECHO',
    when: { all: [active('m05'), { signal: 'dossier-sealed' }] },
    delay: 6000,
    messages: [when({ not: flag('gave_echo_to_moth') }), when(flag('gave_echo_to_moth')), {}],
    effects: [{ flag: 'knows_echo_elin' }],
    choices: [
      { id: 'custody', decision: true, effects: [{ ending: 'custody' }] },
      { id: 'wait', keep: true, then: [{}] },
    ],
  },
  {
    id: 'mt_buy',
    thread: 'MOTH',
    when: { all: [active('m05'), { signal: 'dossier-sealed' }] },
    delay: 15000,
    messages: [{}],
    choices: [
      { id: 'sell', decision: true, effects: [{ ending: 'leverage' }] },
      { id: 'no', keep: true, then: [{}] },
    ],
  },
  {
    id: 'n5_final',
    thread: 'NULL',
    when: { all: [active('m05'), flag('read_own_audit')] },
    delay: 5000,
    messages: [{}, {}, when({ standing: 450 })],
    choices: [
      { id: 'seat', decision: true, effects: [{ ending: 'seat' }] },
      { id: 'ghost', decision: true, effects: [{ ending: 'ghost' }] },
      { id: 'later', keep: true, then: [{}] },
      { id: 'which', keep: true, if: flag('knows_null_devices'), effects: [{ flag: 'mogged_null' }, { standing: 40 }, { achievement: 'asked_null' }], then: [{}, {}] },
    ],
  },
];

// ---------- keys ----------

function bindEffects(effects: RawEffect[] | undefined, prefix: string): Effect[] | undefined {
  let n = 0;
  return effects?.map((e) => ('journal' in e ? { ...e, journal: lineKey(`${prefix}.j.${n++}`) } : e));
}

function bindMsgs(msgs: RawMsg[], prefix: string): Msg[] {
  return msgs.map((m, i) => ({ ...m, text: lineKey(`${prefix}.${i}`) }));
}

function bindChoice(c: RawChoice, beat: string): Choice {
  const p = `${beat}.c.${c.id}`;
  return {
    ...c,
    label: lineKey(`${p}.label`),
    reply: lineKey(`${p}.reply`),
    decision: c.decision ? lineKey(`${p}.decision`) : undefined,
    then: c.then && bindMsgs(c.then, `${p}.then`),
    effects: bindEffects(c.effects, p),
  };
}

export const BEATS: Beat[] = RAW_BEATS.map((b) => ({
  ...b,
  messages: bindMsgs(b.messages, `${b.id}.m`),
  choices: b.choices?.map((c) => bindChoice(c, b.id)),
  effects: bindEffects(b.effects, b.id),
}));

/** Effects that fire on world events rather than on a conversation. */
export const WORLD_RULES: { when: Cond; effects: Effect[]; id: string }[] = [
  { id: 'archive_ending', when: { all: [{ signal: 'archive-submission' }, active('m05')] }, effects: [{ ending: 'record' }] },
];

/** Encoded content is data, not writing: each language carries its own version of the same blob. */
export const ENCODED_EN = ENCODED;
