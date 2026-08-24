/**
 * ParRings - the three par-type rings, DARK SURFACE.
 *
 * Used by screen 1 (hardcoded example figures, labelled as such) and screen 5
 * (the member's own avg_over from get_my_scoring_breakdown_all_courses).
 * Both instances share ONE shape on purpose: the member sees they got exactly
 * what was offered.
 *
 * ALL THREE RINGS SHARE ONE CEILING (RING_MAX) so they are comparable with
 * each other. Colours are designTokens AMBER / BAD / GOOD - the dark values.
 */
import React from 'react';
import { INK, DIM, TRACK, AMBER, GOOD, BAD, LABEL, NUM } from './designTokens';

/** One ceiling for all three rings, so par types read against each other. */
export const RING_MAX = 0.8;

export interface RingDatum {
  /** Average score over par for this hole type. */
  value: number | null | undefined;
  /** Holes played of this type. */
  holes: number | null | undefined;
}

const Ring: React.FC<{
  value: number;
  holes: number | null | undefined;
  label: string;
  holesLabel: string;
  color: string;
  size: number;
}> = ({ value, holes, label, holesLabel, color, size }) => {
  const stroke = size >= 100 ? 9 : size >= 84 ? 8 : 7;
  const figure = size >= 100 ? 21 : size >= 84 ? 18 : 16;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, Math.abs(value) / RING_MAX));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${frac * c} ${c}`}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: figure,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: INK,
            ...NUM,
          }}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <span style={{ ...LABEL, color: DIM }}>{label}</span>
      {holes ? <span style={{ ...LABEL, color: DIM }}>{holesLabel}</span> : null}
    </div>
  );
};

interface Props {
  par3: RingDatum;
  par4: RingDatum;
  par5: RingDatum;
  size?: number;
  labels: { par3: string; par4: string; par5: string };
  /** Formatter for the holes-played sub-label. */
  holesLabel: (n: number) => string;
}

export const ParRings: React.FC<Props> = ({ par3, par4, par5, size = 86, labels, holesLabel }) => {
  const rows: Array<{ d: RingDatum; label: string; color: string }> = [
    { d: par3, label: labels.par3, color: AMBER },
    { d: par4, label: labels.par4, color: BAD },
    { d: par5, label: labels.par5, color: GOOD },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
      {rows.map((row) =>
        row.d.value == null || Number.isNaN(row.d.value) ? (
          <div key={row.label} />
        ) : (
          <Ring
            key={row.label}
            value={row.d.value}
            holes={row.d.holes}
            label={row.label}
            holesLabel={holesLabel(row.d.holes ?? 0)}
            color={row.color}
            size={size}
          />
        ),
      )}
    </div>
  );
};

export default ParRings;
