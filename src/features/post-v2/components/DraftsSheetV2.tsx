// DraftsSheetV2 - list, restore, delete drafts on post_drafts.

import BottomSheet from './BottomSheet';
import { Trash2 } from 'lucide-react';
import type { DraftRow } from '../hooks/useDrafts';

interface Props {
  open: boolean;
  onClose: () => void;
  drafts: DraftRow[];
  onRestore: (d: DraftRow) => void;
  onDelete: (id: string) => void;
}

export default function DraftsSheetV2({ open, onClose, drafts, onRestore, onDelete }: Props) {
  return (
    <BottomSheet open={open} title={`Drafts - ${drafts.length}`} onClose={onClose} fullHeight>
      {drafts.length === 0 && (
        <div style={{ padding: 24, color: '#8A9099', fontSize: 13 }}>No drafts yet.</div>
      )}
      {drafts.map(d => (
        <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <button onClick={() => { onRestore(d); onClose(); }} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer' }}>
            <div style={{ fontSize: 14, color: '#1F2428', fontWeight: 500 }}>{(d.content || '(empty)').slice(0, 80)}</div>
            <div style={{ fontSize: 12, color: '#8A9099', marginTop: 2 }}>{d.actor_type} - {new Date(d.updated_at).toLocaleString()}</div>
          </button>
          <button onClick={() => onDelete(d.id)} aria-label="Delete draft" style={{ background: 'transparent', border: 0, color: '#8A9099', cursor: 'pointer', padding: 8 }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </BottomSheet>
  );
}
