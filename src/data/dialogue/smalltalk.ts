import type { Msg, ThreadId } from '../../game/types';

/**
 * What people say when the player writes something the story did not ask for.
 * These lines never mention anything the speaker should not know yet, and they change nothing:
 * the suggested replies stay open, and only those move the story.
 */
export const SMALLTALK: Partial<Record<ThreadId, Msg[]>> = {
  NULL: [
    { text: 'Noted. I answer what requires an answer.' },
    { text: 'Please keep to the assignment. It is simpler for both of us.' },
    { text: 'I read everything you send. That is not the same as replying to it.' },
    { text: 'If you have a question about the work, ask it plainly.' },
    { text: 'We can discuss that another time. Perhaps.' },
  ],
  VANTA: [
    { text: 'ok so. did you write that down somewhere or just tell me?' },
    { text: 'hm. what did you see, exactly? not what you think it means' },
    { text: 'busy right now. notes first, questions after' },
    { text: 'ask me something with a command in it and I get a lot more talkative' },
    { text: 'heard you. keep going' },
  ],
  MOTH: [
    { text: 'ha... sure. everyone tells me things eventually...' },
    { text: 'interesting... what would you give me for caring about that?' },
    { text: 'I am on call, friend... talk to me when something is on fire...' },
    { text: 'mm... I will remember you said that. I remember most things... it is a problem...' },
    { text: 'funny... that one was almost funny...' },
  ],
  ROOTLESS: [
    { text: 'not much i can do with that' },
    { text: 'careful what you type on their box - you know that by now or you will' },
    { text: 'yeah - welcome to the tenancy' },
    { text: 'i am not your friend kid - i am just still here' },
    { text: 'whatever it is - keep a copy' },
  ],
  ECHO: [
    { text: 'Received. I do not discuss things here without a reason.' },
    { text: 'Be exact, or be quiet. This channel is not safe for approximations.' },
    { text: 'I will reply when there is something to verify.' },
  ],
  lowlight: [
    { from: 'kelpie', text: 'nobody asked, new hire' },
    { from: 'tinsel', text: 'lol ok' },
    { from: 'ostrich_farm', text: 'is this about the invoice again' },
    { from: 'tinsel', text: 'keep it to work chat, the mods are humourless' },
    { from: 'kelpie', text: 'read the room' },
  ],
};

const ATTACH_REPLIES: Partial<Record<ThreadId, Msg[]>> = {
  NULL: [{ text: 'Received. Findings go through the desk, not through this channel.' }, { text: 'I did not ask for this file. I have it now, of course.' }],
  VANTA: [{ text: 'got it. where did it come from and did you hash it first?' }, { text: 'ok. note the source or that file is just a rumour' }],
  MOTH: [{ text: 'oh, a present... I will not ask what it is worth... yet...' }, { text: 'careful... attachments are metadata too...' }],
  ROOTLESS: [{ text: 'dont send me things - it all gets logged' }, { text: 'got it - deleting it - you never sent it' }],
  ECHO: [{ text: 'Do not send files here. Send a hash, and I will tell you if I care.' }],
  lowlight: [{ from: 'tinsel', text: 'do NOT post client files in here' }, { from: 'kelpie', text: 'bold' }],
};

export function smalltalkFor(thread: ThreadId, n: number, attachment: boolean): Msg | null {
  const pool = (attachment ? ATTACH_REPLIES : SMALLTALK)[thread];
  return pool?.length ? pool[n % pool.length] : null;
}

/** Who may acknowledge the player's message with a reaction, and with what. NULL and ECHO do not. */
export const CHAT_REACTIONS: Partial<Record<ThreadId, { from: string; emoji: string[] }>> = {
  VANTA: { from: 'VANTA', emoji: ['👍', '📝', '👀'] },
  MOTH: { from: 'MOTH', emoji: ['🔥', '😏', '👀'] },
  ROOTLESS: { from: 'ROOTLESS', emoji: ['💀', '🫡'] },
  lowlight: { from: 'tinsel', emoji: ['😂', '👀', '💀'] },
};

export const SMALLTALK_STRINGS: string[] = [...Object.values(SMALLTALK), ...Object.values(ATTACH_REPLIES)].flatMap((p) => (p ?? []).map((m) => m.text));
