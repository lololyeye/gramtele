import { useState } from 'react';
import { tr } from '../../i18n';
import type { ChatMessage, Reaction, ThreadId } from '../../game/types';
import { Avatar } from '../components/Avatar';
import { Icon, IconButton } from '../components/Icon';
import { senderName, timeOf } from '../format';
import { useSession } from '../session';
import { AttachmentCard } from './AttachmentCard';
import { MissionCard } from './MissionCard';

export const REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '👀'];

export interface BubbleLayout {
  /** Starts a run of messages from one sender. */
  first: boolean;
  /** Ends a run: this one carries the avatar. */
  last: boolean;
  group: boolean;
  read: boolean;
  fresh: boolean;
  highlighted: boolean;
  query: string;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + query.length)}</mark>{text.slice(at + query.length)}</>;
}

function ReactionRow({ reactions, onToggle }: { reactions: Reaction[]; onToggle: (emoji: string) => void }) {
  const counts = new Map<string, { n: number; mine: boolean; who: string[] }>();
  for (const r of reactions) {
    const e = counts.get(r.emoji) ?? { n: 0, mine: false, who: [] };
    e.n++;
    e.mine ||= r.from === 'me';
    e.who.push(r.from === 'me' ? tr('You') : r.from);
    counts.set(r.emoji, e);
  }
  return (
    <div className="reactions">
      {[...counts].map(([emoji, e]) => (
        <button key={emoji} type="button" className={e.mine ? 'reaction mine' : 'reaction'} title={e.who.join(', ')} aria-pressed={e.mine} aria-label={tr('Reaction {emoji} from {who}', { emoji, who: e.who.join(', ') })} onClick={() => onToggle(emoji)}>
          <span>{emoji}</span>{e.n > 1 && <small>{e.n}</small>}
        </button>
      ))}
    </div>
  );
}

export function MessageBubble({ m, thread, layout }: { m: ChatMessage; thread: ThreadId; layout: BubbleLayout }) {
  const s = useSession();
  const g = s.engine;
  const [picker, setPicker] = useState(false);
  const mine = m.from === 'me';
  const pinned = g.state.threads[thread]?.pinnedMessages?.includes(m.id);
  const text = m.text ? tr(m.text) : '';
  // Encoded payloads and other long unbroken strings read better, and wrap correctly, in the mono face.
  const encoded = /^\S{16,}$/.test(text);
  const react = (emoji: string) => {
    g.react(thread, m.id, emoji);
    setPicker(false);
  };

  if (m.from === 'sys') {
    return <div className={`msg-system ${layout.fresh ? 'fresh' : ''}`} data-msg={m.id} role="note"><span><Highlighted text={text} query={layout.query} /></span></div>;
  }

  return (
    <div data-msg={m.id} className={['msg', mine ? 'out' : 'in', layout.first ? 'first' : '', layout.last ? 'last' : '', layout.fresh ? 'fresh' : '', layout.highlighted ? 'found' : ''].join(' ')}>
      {!mine && <div className="msg-avatar">{layout.last && <Avatar id={m.from} size={34} />}</div>}
      <div className="msg-column">
        <div className={`bubble ${m.invite ? 'has-card' : ''}`}>
          {layout.group && !mine && layout.first && <div className="msg-sender" data-hue={m.from}>{senderName(m.from)}</div>}
          {text && <p className={encoded ? 'msg-text encoded' : 'msg-text'}><Highlighted text={text} query={layout.query} /></p>}
          {m.attachment && <AttachmentCard m={m} thread={thread} />}
          {m.invite && <MissionCard id={m.invite} />}
          <span className="msg-meta">
            {pinned && <span className="msg-pin" title={tr('Pinned')}><Icon name="pin" size={12} /></span>}
            <time dateTime={new Date(m.at).toISOString()}>{timeOf(m.at)}</time>
            {mine && (
              <span className={layout.read ? 'receipt read' : 'receipt'} role="img" aria-label={layout.read ? tr('Read') : tr('Delivered')} title={layout.read ? tr('Read') : tr('Delivered')}>
                <Icon name={layout.read ? 'checks' : 'check'} size={15} />
              </span>
            )}
          </span>
        </div>
        {!!m.reactions?.length && <ReactionRow reactions={m.reactions} onToggle={react} />}
      </div>
      <div className={`msg-actions ${picker ? 'open' : ''}`}>
        <IconButton icon="smile" size={17} label={tr('React to this message')} active={picker} onClick={() => setPicker(!picker)} />
        <IconButton icon="pin" size={17} label={pinned ? tr('Unpin this message') : tr('Pin this message')} active={!!pinned} onClick={() => g.togglePinnedMessage(thread, m.id)} />
        {picker && (
          <div className="reaction-picker" role="group" aria-label={tr('Choose a reaction')}>
            {REACTIONS.map((e, i) => <button key={e} type="button" style={{ animationDelay: `${i * 22}ms` }} aria-label={e} onClick={() => react(e)}>{e}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}
