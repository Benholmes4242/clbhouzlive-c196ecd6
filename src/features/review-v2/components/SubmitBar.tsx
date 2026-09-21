/**
 * SubmitBar - the single pinned action for the wizard.
 * The gate string IS the disabled label; there is no helper text.
 *
 * TWO OPTIONAL COMPANIONS, both owned by the footer so nothing in the scrolling
 * body has to reserve room for them:
 *   summary   one quiet line naming what is about to be sent (omitted when
 *             there is nothing to name — never a placeholder).
 *   skip      a text link directly under the button, shown only when the step
 *             can be passed with nothing. It says what the member GETS, not
 *             what they lose.
 */

import React from 'react';
import { RV2 } from '../tokens';

interface Props {
  label: string;
  enabled: boolean;
  onPress: () => void;
  summary?: string | null;
  skipLabel?: string | null;
  onSkip?: () => void;
}

export function SubmitBar({ label, enabled, onPress, summary, skipLabel, onSkip }: Props) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: RV2.canvas,
        borderTop: `1px solid ${RV2.hairline}`,
        padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 18px)',
      }}
    >
      {summary ? (
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.4,
            color: RV2.secondary,
            marginBottom: 10,
          }}
        >
          {summary}
        </div>
      ) : null}
      <button
        type="button"
        disabled={!enabled}
        onClick={onPress}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 14,
          border: 'none',
          // Enabled = ink fill, canvas label (RV2.onDark is itself near-white
          // now, so it cannot label an ink fill). Disabled keeps a visible fill
          // and a 0.60 label so the gate reads as disabled but PRESENT (§5.2).
          background: enabled ? RV2.ink : RV2.disabledFill,
          color: enabled ? RV2.canvas : RV2.secondary,
          /* CAPS ACTION (§5) — two points down, height unchanged. */
          fontSize: 12.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          cursor: enabled ? 'pointer' : 'not-allowed',
          boxShadow: enabled ? '0 6px 16px rgba(21,23,31,0.22)' : 'none',
          transition: 'background 160ms, color 160ms',
        }}
      >
        {label}
      </button>
      {skipLabel && onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          style={{
            width: '100%',
            marginTop: 12,
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: 14,
            fontWeight: 600,
            color: RV2.secondary,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {skipLabel}
        </button>
      ) : null}
    </div>
  );
}
