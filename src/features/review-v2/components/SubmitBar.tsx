/**
 * SubmitBar - the single pinned action for the wizard.
 * The gate string IS the disabled label; there is no helper text.
 */

import React from 'react';
import { RV2 } from '../tokens';

interface Props {
  label: string;
  enabled: boolean;
  onPress: () => void;
}

export function SubmitBar({ label, enabled, onPress }: Props) {
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
    </div>
  );
}
