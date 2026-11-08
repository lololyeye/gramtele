import { CHARACTERS } from '../../data/characters';
import { tr, T } from '../../i18n';
import type { ThreadId } from '../../game/types';
import { useSession } from '../session';

/** The replies that move the story. They are suggestions: typing the same thing counts too. */
export function QuickReplies({ thread }: { thread: ThreadId }) {
  const s = useSession();
  const g = s.engine;
  const av = g.choicesFor(thread);
  if (!av?.choices.length) return null;
  const c = CHARACTERS[thread];
  const firstContact = av.contactRequest && !g.state.threads[thread]?.messages.some((m) => m.from === 'me');
  return (
    <div className="quick-replies" role="group" aria-label={T('suggested_replies')}>
      {firstContact && <p className="contact-request">{T('name_has_asked_to_contact', { name: tr(c.handle) })}</p>}
      <div className="quick-list">
        {av.choices.map((ch, i) => (
          <button key={ch.id} type="button" className={ch.decision ? 'quick decision' : 'quick'} style={{ animationDelay: `${i * 45}ms` }} onClick={() => g.choose(thread, ch.id)}>
            <kbd>{i + 1}</kbd>
            <span>{tr(ch.label)}</span>
            {ch.decision && <small>{T('this_will_be_remembered')}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
