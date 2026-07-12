/**
 * SubmitBar — pinned bottom submit action for the composer.
 */

import React from 'react';
import { RV2 } from '../tokens';

interface Props {
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  isEditMode?: boolean;
  disabledLabel?: string;
}

export function SubmitBar({
  canSubmit,
  submitting,
  onSubmit,
  isEditMode,
  disabledLabel = 'Continue with your verdict',
}: Props) {
  const enabled = canSubmit && !submitting;
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, #F8FAFC 30%)',
        padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      <button
        type="button"
        disabled={!enabled}
        onClick={onSubmit}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 14,
          border: 'none',
          background: enabled ? RV2.amber : 'rgba(15,23,42,0.10)',
          color: enabled ? '#FFFFFF' : RV2.secondary,
          fontSize: 14.5,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          cursor: enabled ? 'pointer' : 'not-allowed',
          boxShadow: enabled ? '0 6px 16px rgba(247,147,30,0.28)' : 'none',
          transition: 'background 160ms, color 160ms',
        }}
      >
        {submitting
          ? isEditMode ? 'Saving...' : 'Posting...'
          : canSubmit
            ? isEditMode ? 'Save changes' : 'Share your verdict'
            : disabledLabel}
      </button>
    </div>
  );
}
