/* DISCARD DRAFT CONFIRMATION (BRIEF_SHEET_BACK_BEHAVIOUR_02 §3)
 *
 * The one question asked before a sheet throws away something the member
 * typed, picked, or attached. Paired with useDraftDismissGuard.
 *
 * RULES ENCODED HERE
 *  - Keeping the draft is the easy choice: it is the filled, full-width
 *    action and it is what Escape and a backdrop tap do.
 *  - Discarding is a deliberate second action, plain text, never the default
 *    and never pre-focused.
 *  - No amber. Amber means the viewing member or a deliberate Post control,
 *    never a warning surface.
 *  - Renders above the sheet it belongs to via a portal, so it is not
 *    clipped by the sheet's own overflow or transform.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const SURFACE = '#1B1E27';
const INK = 'rgba(255,255,255,0.96)';
const INK_SOFT = 'rgba(255,255,255,0.62)';
const HAIRLINE = 'rgba(255,255,255,0.10)';

interface Props {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  /** Must sit above the sheet that owns the draft. */
  zIndex?: number;
}

export function DiscardDraftDialog({ open, onKeepEditing, onDiscard, zIndex = 20000 }: Props) {
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onKeepEditing();
      }
    };
    // Capture: the owning sheet also listens for Escape and would close
    // underneath the question.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onKeepEditing]);

  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('draftGuard.question')}
      onClick={onKeepEditing}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: 'rgba(0,0,0,0.56)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 320,
          background: SURFACE,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
          {t('draftGuard.question')}
        </div>
        <div style={{ fontSize: 13, color: INK_SOFT, marginTop: 6, lineHeight: 1.4 }}>
          {t('draftGuard.body')}
        </div>
        <button
          type="button"
          onClick={onKeepEditing}
          style={{
            marginTop: 16,
            width: '100%',
            height: 44,
            borderRadius: 12,
            border: 0,
            background: '#F8FAFC',
            color: '#0F172A',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('draftGuard.keepEditing')}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          style={{
            marginTop: 8,
            width: '100%',
            height: 44,
            borderRadius: 12,
            border: 0,
            background: 'transparent',
            color: INK_SOFT,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('draftGuard.discard')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
