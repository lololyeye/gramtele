import { tr } from '../i18n';
import { afterEach, describe, expect, it } from 'vitest';
import { GameEngine, matchChoice, newState } from './engine';
import { validateSave } from './persistence';
import type { Choice, ThreadId } from './types';

function game() {
  let now = 1000;
  const g = new GameEngine(newState(), { realNow: () => now });
  g.state.settings.typingSpeed = 'instant';
  g.signUp('tester');
  const pass = () => {
    for (let i = 0; i < 60; i++) {
      now += 500;
      g.tick();
    }
  };
  pass();
  return { g, pass };
}

afterEach(() => undefined);

describe('messaging', () => {
  it('answers free text in character without moving the story', () => {
    const { g, pass } = game();
    const beats = [...g.state.firedBeats];
    const before = g.choicesFor('NULL')?.beat.id;
    expect(g.sendMessage('NULL', 'who are you really?')).toBe('message');
    pass();
    const msgs = g.state.threads.NULL.messages;
    expect(msgs.some((m) => m.from === 'me' && m.text === 'who are you really?')).toBe(true);
    expect(msgs.at(-1)?.from).toBe('NULL');
    expect(g.state.firedBeats).toEqual(beats);
    expect(g.choicesFor('NULL')?.beat.id).toBe(before);
  });

  it('treats a typed suggested reply as the choice itself', () => {
    const { g, pass } = game();
    const av = g.choicesFor('NULL');
    expect(av).toBeTruthy();
    const pick = av!.choices[0];
    expect(g.sendMessage('NULL', tr(pick.label))).toBe('choice');
    pass();
    expect(g.state.threads.NULL.messages.some((m) => m.from === 'me' && m.text === (pick.reply ?? pick.label))).toBe(true);
  });

  it('matches by number, by words, and refuses vague text', () => {
    const choices = [{ id: 'a', label: 'I will take the job.' }, { id: 'b', label: 'Tell me who pays first.' }] as Choice[];
    expect(matchChoice('2', choices)?.id).toBe('b');
    expect(matchChoice('tell me who pays first', choices)?.id).toBe('b');
    expect(matchChoice('hello there', choices)).toBeNull();
    expect(matchChoice('job', choices)).toBeNull();
  });

  it('refuses empty messages and closed conversations', () => {
    const { g } = game();
    expect(g.sendMessage('NULL', '   ')).toBe('refused');
    g.state.threads.lowtide = { messages: [], unread: 0, archived: true, visible: true };
    expect(g.sendMessage('lowtide', 'hello')).toBe('refused');
    expect(g.canWrite('lowtide')).toBe(false);
  });

  it('sends a workbench file as an attachment and leaves missing files alone', () => {
    const { g, pass } = game();
    expect(g.sendFile('NULL', '/home/player/notes.txt')).toBe(true);
    const sent = g.state.threads.NULL.messages.at(-1)!;
    expect(sent.attachment?.name).toBe('notes.txt');
    expect(sent.attachment?.preview).toContain('Lindgate');
    expect(g.sendFile('NULL', '/home/player/nothing.txt')).toBe(false);
    pass();
    expect(g.state.threads.NULL.messages.at(-1)?.from).toBe('NULL');
  });

  it('toggles reactions, pins and mute, and keeps them through a save', () => {
    const { g } = game();
    const id: ThreadId = 'NULL';
    const first = g.state.threads[id].messages[0];
    g.react(id, first.id, '👍');
    expect(first.reactions).toEqual([{ emoji: '👍', from: 'me' }]);
    g.togglePinnedMessage(id, first.id);
    g.toggleMuted(id);
    const pinnedBefore = g.state.threads[id].pinned;
    g.togglePinned(id);
    const restored = validateSave(JSON.parse(JSON.stringify(g.state)));
    expect('state' in restored).toBe(true);
    if ('state' in restored) {
      const th = restored.state.threads[id];
      expect(th.pinnedMessages).toEqual([first.id]);
      expect(th.muted).toBe(true);
      expect(th.pinned).toBe(!pinnedBefore);
      expect(th.messages[0].reactions).toHaveLength(1);
    }
    g.react(id, first.id, '👍');
    expect(first.reactions).toEqual([]);
  });

  it('reports where the unread separator belongs', () => {
    const { g, pass } = game();
    const th = g.state.threads.NULL;
    expect(g.firstUnreadId('NULL')).toBe(th.messages.at(-th.unread)!.id);
    g.markRead('NULL');
    expect(g.firstUnreadId('NULL')).toBeNull();
    g.sendMessage('NULL', 'one more thing');
    pass();
    expect(g.firstUnreadId('NULL')).toBe(th.messages.at(-1)!.id);
  });

  it('does not notify for a muted conversation', () => {
    const { g, pass } = game();
    g.toggleMuted('NULL');
    g.toasts.length = 0;
    g.sendMessage('NULL', 'anything');
    pass();
    expect(g.toasts.filter((t) => t.thread === 'NULL')).toHaveLength(0);
  });
});
