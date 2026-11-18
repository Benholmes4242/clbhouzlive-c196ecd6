/**
 * EditLossSheet — REVIEW_EDITOR_SAFETY §2. Asked before an edit saves over
 * published words or removes published photos/videos. Same bottom-sheet
 * pattern as RemoveReviewSheetV2; "Keep them" changes nothing.
 */
import React, { useEffect } from 'react';
import { RV2 } from '../tokens';
import { TITLE } from '@/lib/tokens/type';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';

export interface EditLoss { textRemoved: boolean; photos: number; videos: number }

/** Null when the save loses nothing published. */
export function editLoss(publishedText: string, nextText: string, removals: readonly { type: string }[]): EditLoss | null {
  const textRemoved = publishedText.trim().length > 0 && nextText.trim().length === 0;
  const videos = removals.filter(r => r.type === 'video').length;
  const photos = removals.length - videos;
  return textRemoved || removals.length > 0 ? { textRemoved, photos, videos } : null;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
/** "your written review, 3 photos and 1 video" */
export function lossList(loss: EditLoss): string {
  const parts = [
    loss.textRemoved ? 'your written review' : null,
    loss.photos ? plural(loss.photos, 'photo') : null,
    loss.videos ? plural(loss.videos, 'video') : null,
  ].filter(Boolean) as string[];
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] ?? '';
}

export function EditLossSheet({ loss, onKeep, onConfirm }: { loss: EditLoss | null; onKeep: () => void; onConfirm: () => void }) {
  const open = !!loss;
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);
  if (!loss) return null;
  const list = lossList(loss);
  const action: React.CSSProperties = { flex: 1, padding: 12, borderRadius: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.10em', cursor: 'pointer' };
  return (
    <div role="dialog" aria-modal="true" data-edit-loss-sheet onClick={onKeep}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: RV2.scrim, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: RV2.canvas, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: RV2.trackStrong }} />
        </div>
        <div>
          <div style={{ ...TITLE, color: RV2.ink }}>Remove from your review?</div>
          <div data-edit-loss-list style={{ fontSize: 13, color: RV2.secondary, marginTop: 2 }}>{list.charAt(0).toUpperCase() + list.slice(1)} will be removed.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onConfirm} style={{ ...action, background: RV2.ghost, border: `1px solid ${RV2.hairline}`, fontWeight: 600, color: RV2.ink }}>Remove and save</button>
          <button type="button" onClick={onKeep} style={{ ...action, background: RV2.ink, border: 'none', fontWeight: 700, color: RV2.canvas }}>Keep them</button>
        </div>
      </div>
    </div>
  );
}
