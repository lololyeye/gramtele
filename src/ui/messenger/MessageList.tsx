import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CHARACTERS } from '../../data/characters';
import { tr, T, Tn } from '../../i18n';
import type { ThreadId } from '../../game/types';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { dayLabel } from '../format';
import { useSession } from '../session';
import { MessageBubble } from './MessageBubble';

const RUN_GAP = 5 * 60_000;
const dayOf = (t: number) => Math.floor(t / 86_400_000);

export function TypingBubble({ thread }: { thread: ThreadId }) {
  const s = useSession();
  const next = s.engine.state.pendingMessages.find((m) => m.thread === thread);
  const who = next?.msg.from && next.msg.from !== 'sys' ? next.msg.from : thread;
  return (
    <div className="msg in first last typing-row" aria-live="off">
      <div className="msg-avatar"><Avatar id={who} size={34} /></div>
      <div className="bubble typing" role="img" aria-label={T('name_is_typing', { name: tr(CHARACTERS[who as ThreadId]?.handle ?? who) })}><i /><i /><i /></div>
    </div>
  );
}

export function MessageList({ thread, unreadFrom, query, focusId }: { thread: ThreadId; unreadFrom: number | null; query: string; focusId: number | null }) {
  const s = useSession();
  const g = s.engine;
  const th = g.state.threads[thread];
  const messages = th?.messages ?? [];
  const group = CHARACTERS[thread].kind === 'group';
  const typing = g.isTyping(thread);
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [below, setBelow] = useState(false);
  // Only messages that arrive while the conversation is open animate in.
  const known = useRef<{ thread: ThreadId; last: number }>({ thread, last: messages.at(-1)?.id ?? 0 });
  if (known.current.thread !== thread) known.current = { thread, last: messages.at(-1)?.id ?? 0 };
  const seenUpTo = known.current.last;

  const lastOther = messages.reduce((n, m, i) => (m.from !== 'me' && m.from !== 'sys' ? i : n), -1);

  const toBottom = (smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Opening a conversation lands on the first unread message, or the end.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const sep = el.querySelector('.unread-sep') as HTMLElement | null;
    if (sep) el.scrollTop = Math.max(0, sep.offsetTop - 80);
    else el.scrollTop = el.scrollHeight;
    atBottom.current = !sep;
    setBelow(!!sep && el.scrollHeight - el.scrollTop - el.clientHeight > 80);
    // Runs once per conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread]);

  // New messages keep you at the end only if you were already there; your own always do.
  const lastId = messages.at(-1)?.id;
  const lastMine = messages.at(-1)?.from === 'me';
  useLayoutEffect(() => {
    if (atBottom.current || lastMine) toBottom(s.motionOk());
    known.current.last = lastId ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, typing]);

  useEffect(() => {
    if (focusId === null) return;
    scroller.current?.querySelector(`[data-msg="${focusId}"]`)?.scrollIntoView({ block: 'center', behavior: s.motionOk() ? 'smooth' : 'auto' });
  }, [focusId, s]);

  return (
    <div className="messages-wrap">
      <div className="messages" ref={scroller} onScroll={(e) => {
        const el = e.currentTarget;
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        atBottom.current = near;
        setBelow(!near);
      }}>
        <div className="messages-inner" role="log" aria-live="polite" aria-label={T('messages')}>
          {!messages.length && (
            <div className="messages-empty">
              <Avatar id={thread} size={64} />
              <p>{T('no_messages_yet')}</p>
            </div>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const newDay = !prev || dayOf(prev.at) !== dayOf(m.at);
            const sameRun = (a: typeof m | undefined, b: typeof m | undefined) => !!a && !!b && a.from === b.from && b.at - a.at < RUN_GAP && dayOf(a.at) === dayOf(b.at);
            const unreadStart = unreadFrom === m.id;
            return (
              <Fragment key={m.id}>
                {newDay && <div className="day-sep"><span>{dayLabel(m.at, g.now())}</span></div>}
                {unreadStart && <div className="unread-sep"><span>{T('unread_messages')}</span></div>}
                <MessageBubble m={m} thread={thread} layout={{
                  first: newDay || unreadStart || !sameRun(prev, m),
                  last: !sameRun(m, next) || unreadFrom === next?.id,
                  group,
                  read: i < lastOther,
                  fresh: m.id > seenUpTo,
                  highlighted: focusId === m.id,
                  query,
                }} />
              </Fragment>
            );
          })}
          {typing && <TypingBubble thread={thread} />}
        </div>
      </div>
      {below && (
        <button type="button" className="to-bottom" aria-label={T('jump_to_the_latest_message')} title={T('jump_to_the_latest_message')} onClick={() => toBottom(s.motionOk())}>
          <Icon name="down" />
          {!!th?.unread && <span className="badge" aria-label={Tn('n_unread_message', 'n_unread_messages', th.unread)}>{th.unread}</span>}
        </button>
      )}
    </div>
  );
}
