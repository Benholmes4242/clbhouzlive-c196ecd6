import React from 'react';

interface SectionLabelProps {
  text: string;
  /** When true, use brand amber for the bar + label. Defaults to slate ink. */
  accent?: boolean;
}

/**
 * Canonical Course Detail section label.
 * 3px×13 vertical bar + 9px / 900-weight uppercase eyebrow with 0.18em tracking.
 * Used across the About tab (`| ABOUT`, `| YOUR JOURNEY`, `| COURSE DETAILS`, `| LOCATION`).
 */
export const SectionLabel: React.FC<SectionLabelProps> = ({ text, accent = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 14 }}>
    <div style={{ width: 3, height: 13, background: accent ? '#F7931E' : '#0F172A', borderRadius: 1 }} />
    <span
      style={{
        fontSize: 9,
        fontWeight: 900,
        color: accent ? '#F7931E' : '#0F172A',
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
      }}
    >
      {text}
    </span>
  </div>
);

export default SectionLabel;
