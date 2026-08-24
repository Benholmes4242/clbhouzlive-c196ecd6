/**
 * ShareToggle — "Share to your feed" true toggle.
 * Ink (near-white) track when on, quiet track when off, on the dark composer
 * canvas. The knob inverts against the track so both states stay legible.
 */

import React from 'react';
import { RV2 } from '../tokens';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

const TRACK_ON = RV2.ink;

export function ShareToggle({ value, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 16px',
        background: RV2.cardBg,
        border: `1px solid ${RV2.hairline}`,
        borderRadius: RV2.panelRadius,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: RV2.ink, letterSpacing: '-0.005em' }}>
          Share to your feed
        </div>
        <div style={{ fontSize: 12, color: RV2.secondary, marginTop: 2 }}>
          {value ? 'Friends will see this review' : 'Course page only'}
        </div>
      </div>
      <div
        aria-hidden
        style={{
          position: 'relative',
          width: 42,
          height: 24,
          borderRadius: 999,
          background: value ? TRACK_ON : RV2.trackStrong,
          transition: 'background 160ms ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: value ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: value ? RV2.canvas : RV2.ink,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 160ms ease',
          }}
        />
      </div>
    </button>
  );
}
