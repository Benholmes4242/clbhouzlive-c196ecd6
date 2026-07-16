// DraftsSheetV2 - list, restore, delete drafts on post_drafts.
// Empty state + filled rows aligned to messaging-v2 polish.

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { Pencil, Trash2 } from 'lucide-react';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import type { DraftRow } from '../hooks/useDrafts';

interface Props {
  open: boolean;
  onClose: () => void;
  drafts: DraftRow[];
  onRestore: (d: DraftRow) => void;
  onDelete: (id: string) => void;
}

export default function DraftsSheetV2({ open, onClose, drafts, onRestore, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <BottomSheet open={open} title={drafts.length > 0 ? `Drafts - ${drafts.length}` : 'Drafts'} onClose={onClose} fullHeight>
      {drafts.length === 0 ? (
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={22} color="#F8FAFC" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Nothing saved yet</div>
          <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 280, lineHeight: 1.45 }}>
            Close a post mid-write and we'll offer to keep it here - ready when you are.
          </div>
        </div>
      ) : (
        <>
          {drafts.map(d => {
            const isBusiness = d.actor_type === 'business';
            return (
              <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: isBusiness ? '#F7931E' : '#0F172A',
                    color: isBusiness ? '#15171F' : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    flex: '0 0 auto',
                  }}
                >
                  {isBusiness ? 'B' : 'P'}
                </div>
                <button
                  onClick={() => { onRestore(d); onClose(); }}
                  style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', minWidth: 0, padding: 0 }}
                >
                  <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(d.content || '(no caption yet)').slice(0, 100)}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {relativeTime(d.updated_at)}{isBusiness ? ' - as business' : ''}
                    {d.course_name ? ` - ${d.course_name}` : ''}
                  </div>
                </button>
                <button
                  onClick={() => setConfirmId(d.id)}
                  aria-label="Delete draft"
                  style={{ background: 'transparent', border: 0, color: '#94A3B8', cursor: 'pointer', padding: 8 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          <div style={{ padding: '16px', fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
            Drafts keep your words, tags and settings - media re-attaches on restore.
          </div>
        </>
      )}

      {confirmId && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.35)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }}>
          <div style={{ width: '100%', background: '#F8FAFC', padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Delete this draft?</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>This can't be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, background: '#fff', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: '#0F172A' }}>Cancel</button>
              <button
                onClick={() => { const id = confirmId; setConfirmId(null); onDelete(id!); }}
                style={{ flex: 1, background: '#B00020', color: '#F8FAFC', border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
