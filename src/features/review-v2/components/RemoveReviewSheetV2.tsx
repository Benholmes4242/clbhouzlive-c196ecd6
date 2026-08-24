/**
 * RemoveReviewSheetV2 — confirm sheet. Deletion goes through the v2 RPC
 * and cleanup-review-media handles storage assets.
 */

import React, { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { RV2 } from '../tokens';
import { TITLE } from '@/lib/tokens/type';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';

interface Props {
  open: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveReviewSheetV2({ open, submitting, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: RV2.scrim,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: RV2.canvas,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: RV2.trackStrong }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(239,68,68,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={18} color={RV2.danger} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...TITLE, color: RV2.ink }}>Remove review?</div>
            <div style={{ fontSize: 12.5, color: RV2.secondary, marginTop: 2 }}>
              Your score, verdict, and any media go with it.
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: RV2.ghost,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} color={RV2.secondary} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              background: RV2.ghost,
              border: `1px solid ${RV2.hairline}`,
              fontSize: 14,
              fontWeight: 600,
              color: RV2.ink,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              background: RV2.danger,
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              color: RV2.dark,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
