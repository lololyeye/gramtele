import { useEffect, useRef, useState } from 'react';
import { tr } from '../../i18n';
import type { ThreadId } from '../../game/types';
import { useSession } from '../session';
import { ChatHeader, PinnedBanner, ThreadSearch } from './ChatHeader';
import { Composer } from './Composer';
import { ConversationList } from './ConversationList';
import { DetailsPanel } from './DetailsPanel';
import { MessageList } from './MessageList';
import { QuickReplies } from './QuickReplies';

export function MessengerView() {
  const s = useSession();
  const g = s.engine;
  const active = s.thread;
  const [details, setDetails] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<number | null>(s.pendingFocus);
  const [unreadFrom, setUnreadFrom] = useState<number | null>(() => g.firstUnreadId(active));
  const th = g.state.threads[active];
  const prior = useRef(active);

  // The unread line is worked out once on opening and stays until you leave.
  if (prior.current !== active) {
    prior.current = active;
    setUnreadFrom(g.firstUnreadId(active));
    setSearching(false);
    setQuery('');
    setFocusId(s.pendingFocus);
  }

  useEffect(() => {
    if (s.pendingFocus !== null) {
      setFocusId(s.pendingFocus);
      s.pendingFocus = null;
    }
  });

  useEffect(() => {
    if (s.view === 'gramtele') g.markRead(active);
  }, [g, s.view, active, th?.messages.length]);

  // Digits answer with a suggested reply, unless you are typing somewhere.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key)) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return;
      const choice = g.choicesFor(active)?.choices[Number(e.key) - 1];
      if (choice) {
        e.preventDefault();
        g.choose(active, choice.id);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [g, active]);

  const open = (id: ThreadId, messageId?: number) => {
    s.pendingFocus = messageId ?? null;
    s.thread = id;
    s.conversationOpen = true;
    if (window.matchMedia('(max-width: 860px)').matches) setDetails(false);
    s.notify();
  };

  const focusMessage = (id: number) => {
    setFocusId(id);
    if (window.matchMedia('(max-width: 1240px)').matches) setDetails(false);
  };

  return (
    <div className={`messenger ${s.conversationOpen ? 'conversation-open' : ''} ${details ? 'details-open' : ''}`}>
      <ConversationList active={active} onOpen={open} />
      <section className="chat" aria-label={tr('Conversation')} key={active}>
        <ChatHeader
          thread={active}
          onBack={() => { s.conversationOpen = false; s.notify(); }}
          detailsOpen={details}
          onDetails={() => setDetails(!details)}
          searching={searching}
          onSearch={() => { setSearching(!searching); setQuery(''); setFocusId(null); }}
        />
        {searching && <ThreadSearch thread={active} query={query} onQuery={setQuery} onFocusMessage={setFocusId} onClose={() => { setSearching(false); setQuery(''); setFocusId(null); }} />}
        <PinnedBanner thread={active} onFocusMessage={setFocusId} />
        <MessageList thread={active} unreadFrom={unreadFrom} query={searching ? query.trim() : ''} focusId={focusId} />
        <QuickReplies thread={active} />
        <Composer thread={active} />
      </section>
      {details && (
        <DetailsPanel
          thread={active}
          onClose={() => setDetails(false)}
          onFocusMessage={focusMessage}
          onSearch={() => { setSearching(true); setQuery(''); if (window.matchMedia('(max-width: 1240px)').matches) setDetails(false); }}
        />
      )}
    </div>
  );
}
