// DraftsSheetV2 - list, restore, delete drafts on post_drafts.
// Empty state + filled rows aligned to messaging-v2 polish.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from './BottomSheet';
import { Pencil, Trash2 } from 'lucide-react';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import type { DraftRow } from '../hooks/useDrafts';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  drafts: DraftRow[];
  onRestore: (d: DraftRow) => void;
  onDelete: (id: string) => void;
}

export default function DraftsSheetV2({ open, onClose, drafts, onRestore, onDelete }: Props) {
  const { t } = useTranslation('composer');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <BottomSheet open={open} title={drafts.length > 0 ? `Drafts - ${drafts.length}` : 'Drafts'} onClose={onClose} fullHeight>
      {drafts.length === 0 ? (
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: CT.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={22} color={CT.canvas} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: CT.ink }}>Nothing saved yet</div>
          <div style={{ fontSize: 13, color: CT.secondary, textAlign: 'center', maxWidth: 280, lineHeight: 1.45 }}>
            Close a post mid-write and we'll offer to keep it here - ready when you are.
          </div>
        </div>
      ) : (
        <>
          {drafts.map(d => {
            const isBusiness = d.actor_type === 'business';
            return (
              <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: isBusiness ? CT.amber : CT.ink,
                    color: isBusiness ? CT.dark : CT.canvas,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flex: '0 0 auto',
                  }}
                >
                  {isBusiness ? 'B' : 'P'}
                </div>
                <button
                  onClick={() => { onRestore(d); onClose(); }}
                  style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', minWidth: 0, padding: 0 }}
                >
                  <div style={{ fontSize: 14, color: CT.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(d.content || '(no caption yet)').slice(0, 100)}
                  </div>
                  <div style={{ fontSize: 12, color: CT.secondary, marginTop: 2 }}>
                    {relativeTime(d.updated_at)}{isBusiness ? ' - as business' : ''}
                    {d.course_name ? ` - ${d.course_name}` : ''}
                  </div>
                </button>
                <button
                  onClick={() => setConfirmId(d.id)}
                  aria-label="Delete draft"
                  style={{ background: 'transparent', border: 0, color: CT.secondary, cursor: 'pointer', padding: 8 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          <div style={{ padding: '16px', fontSize: 12, color: CT.secondary, textAlign: 'center' }}>
            {t('drafts.footerNote')}
          </div>
        </>
      )}

      {confirmId && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.35)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }}>
          <div style={{ width: '100%', background: CT.canvas, padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: CT.ink }}>Delete this draft?</div>
            <div style={{ fontSize: 13, color: CT.secondary }}>This can't be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, background: 'rgba(248,250,252,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.10em', cursor: 'pointer', color: CT.ink }}>Cancel</button>
              <button
                onClick={() => { const id = confirmId; setConfirmId(null); onDelete(id!); }}
                style={{ flex: 1, background: CT.danger, color: CT.canvas, border: 0, borderRadius: 12, padding: '12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', cursor: 'pointer' }}
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
