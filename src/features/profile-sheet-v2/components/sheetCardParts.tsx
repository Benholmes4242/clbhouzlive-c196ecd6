/**
 * ProfileSheetV2 — shared card vocabulary for the handicap slot, Your form and
 * Your courses. Every colour reads an existing token (A.*); see the rebuild
 * report for the spec values that have no token and what stands in for them.
 */
import React from 'react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';

export const CARD: React.CSSProperties = {
  background: A.PANEL,
  border: `1px solid ${A.BORDER}`,
  borderRadius: 14,
  padding: '14px 14px 12px',
  margin: '0 20px 9px',
  fontFamily: SANS,
};

export const CARD_LABEL: React.CSSProperties = {
  fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM,
};

export const SAY: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.45, color: A.MUTE, marginTop: 9 };

export const BIG: React.CSSProperties = {
  fontSize: 40, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.04em', color: A.INK, ...FIGS,
};

export const Door: React.FC<{ label: string; onClick: () => void; style?: React.CSSProperties }> = ({ label, onClick, style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, width: '100%',
      marginTop: 10, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: SANS,
      fontSize: 10.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: A.AMBER,
      ...style,
    }}
  >
    {label} <span aria-hidden>{'\u203A'}</span>
  </button>
);

/** The one solid amber call to action in PART THREE. Always /manage/handicap (H.10). */
export const Cta: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
      marginTop: 14, background: A.AMBER, color: A.CANVAS, border: 0, borderRadius: 12, padding: 14,
      fontFamily: SANS, fontSize: 13.5, fontWeight: 800, letterSpacing: '0.02em', cursor: 'pointer',
    }}
  >
    {label} <span aria-hidden>{'\u203A'}</span>
  </button>
);

export const CardHead: React.FC<{ label: string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
    <span style={CARD_LABEL}>{label}</span>
    {right}
  </div>
);
