/**
 * ShareToggle — the share-to-the-Clubhouse true toggle.
 * Ink (near-white) track when on, quiet track when off, on the dark composer
 * canvas. The knob inverts against the track so both states stay legible.
 *
 * TWO SHAPES, ONE KNOB. The default is the bordered card. `bare` strips the
 * card chrome so the control reads as ONE ROW at the foot of step 3, which is
 * what the rating screen asks for: it is a switch on a screen, not a panel of
 * its own. The copy is supplied by the host because the sub-line changes with
 * what is actually being shared.
 */

import React from 'react';
import { RV2 } from '../tokens';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  /** Row title. Defaults to the historical card copy. */
  title?: string;
  /** Row sub-line. Defaults to the historical card copy. */
  sub?: string;
  /** True: no card background, border or radius — one row. */
  bare?: boolean;
}

const TRACK_ON = RV2.ink;

export function ShareToggle({ value, onChange, title, sub, bare }: Props) {
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
        padding: bare ? '14px 0' : '12px 16px',
        background: bare ? 'transparent' : RV2.cardBg,
        border: bare ? 'none' : `1px solid ${RV2.hairline}`,
        borderRadius: bare ? 0 : RV2.panelRadius,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: RV2.ink, letterSpacing: '-0.005em' }}>
          {title ?? 'Share to your feed'}
        </div>
        <div style={{ fontSize: 12, color: RV2.secondary, marginTop: 2 }}>
          {sub ?? (value ? 'Friends will see this review' : 'Course page only')}
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
