import { useState } from 'react';
import { tr, ui, Tn, T } from '../../i18n';
import type { ChatMessage, ThreadId } from '../../game/types';
import { Icon, IconName } from '../components/Icon';
import { shortPath } from '../format';
import { useSession } from '../session';

const KIND_ICON: Record<string, IconName> = { text: 'file', file: 'file', photo: 'photo' };
const KIND_LABEL: Record<string, string> = { text: ui('text'), file: ui('file'), photo: ui('photo') };

export function AttachmentCard({ m, thread }: { m: ChatMessage; thread: ThreadId }) {
  const s = useSession();
  const at = m.attachment!;
  const [open, setOpen] = useState(false);
  const preview = tr(at.preview);
  const lines = preview.split('\n').length;
  return (
    <div className={open ? 'attachment open' : 'attachment'}>
      <button type="button" className="attachment-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="attachment-icon"><Icon name={KIND_ICON[at.kind]} size={20} /></span>
        <span className="attachment-info">
          <strong>{at.name}</strong>
          <small>{tr(KIND_LABEL[at.kind])} · {Tn('n_line', 'n_lines', lines)}</small>
        </span>
        <span className="attachment-chevron"><Icon name="down" size={16} /></span>
      </button>
      <div className="attachment-body">
        <div className="attachment-clip">
          <pre>{preview}</pre>
        </div>
      </div>
      {at.file && (
        <button type="button" className="attachment-save" disabled={m.taken} onClick={() => s.engine.takeAttachment(thread, m.id)}>
          <Icon name={m.taken ? 'check' : 'save'} size={15} />
          {m.taken ? T('saved_to_path', { path: shortPath(at.file.path) }) : T('save_to_workbench')}
        </button>
      )}
    </div>
  );
}
