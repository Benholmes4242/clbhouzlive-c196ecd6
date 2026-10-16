/**
 * BRIEF_YOU_TAB_1A — shared parts of the played-state You tab, drawn to
 * you-tab-many-rounds.html. Tones are the analytical A tokens, MEDAL_GOLD, and
 * alpha stops DERIVED from existing ink/white tokens (no new colour values).
 * Amber here is A.AMBER (existing state; no new amber owner).
 */
import React from 'react';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { INVERTED_CONTROL_SURFACE, inkWithAlpha, surfaceWithAlpha } from '@/lib/tokens/surfaces';

const W = (a: number) => surfaceWithAlpha(INVERTED_CONTROL_SURFACE, a);

export const Y = {
  ...A,
  GOLD: MEDAL_GOLD,
  GOLD_EDGE: surfaceWithAlpha(MEDAL_GOLD, 0.28),
  LIFETIME: inkWithAlpha(A.INK, 0.55),
  SEASON_BAR: inkWithAlpha(A.INK, 0.22),
  TRACK5: W(0.05),
  RULE8: W(0.08),
  PIP_OPEN: W(0.12),
  BASELINE: W(0.14),
  ZERO: W(0.22),
} as const;

export const words = (n: number): string => {
  const w = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  return n >= 0 && n < w.length ? w[n] : String(n);
};
export const Words = (n: number) => { const s = words(n); return s.charAt(0).toUpperCase() + s.slice(1); };
export const signed1 = (v: number) => { const r = Math.round(v * 10) / 10; return r > 0 ? `+${r.toFixed(1)}` : r < 0 ? `\u2212${Math.abs(r).toFixed(1)}` : '0.0'; };
export const signed2 = (v: number) => { const r = Math.round(v * 100) / 100; return r > 0 ? `+${r.toFixed(2)}` : r < 0 ? `\u2212${Math.abs(r).toFixed(2)}` : '0.00'; };
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const Sec: React.FC<{ kicker: string; title?: string | null; children: React.ReactNode }> = ({ kicker, title, children }) => (
  <section style={{ padding: '20px 18px', borderBottom: `1px solid ${A.SOFT}`, fontFamily: SANS }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.AMBER, marginBottom: 5 }}>{kicker}</div>
    {title ? <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: A.INK }}>{title}</h2> : null}
    {children}
  </section>
);

export const Lede: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5, color: A.MUTE }}>{children}</p>
);

export const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <b style={{ color: A.INK, fontWeight: 700, ...FIGS }}>{children}</b>
);

export const Said: React.FC<{ quiet?: boolean; children: React.ReactNode }> = ({ quiet, children }) => (
  <p style={{
    margin: '14px 0 0', paddingLeft: 11, borderLeft: `2px solid ${quiet ? Y.BASELINE : A.AMBER}`,
    fontSize: 13, lineHeight: 1.5, color: quiet ? A.MUTE : A.BODY,
  }}>{children}</p>
);

export interface FactItem { value: string; label: string; tone?: string }
export const Facts: React.FC<{ items: FactItem[]; marginTop?: number }> = ({ items, marginTop = 15 }) =>
  items.length === 0 ? null : (
    <div style={{ display: 'flex', gap: 7, marginTop }}>
      {items.map((f) => (
        <div key={f.label} style={{ flex: 1, background: A.PANEL, border: `1px solid ${A.SOFT}`, borderRadius: 11, padding: '10px 9px' }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: f.tone ?? A.INK, ...FIGS }}>{f.value}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.DIM, marginTop: 3, lineHeight: 1.3 }}>{f.label}</div>
        </div>
      ))}
    </div>
  );

export const More: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <button type="button" onClick={onPress} style={{ display: 'block', marginTop: 13, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: A.AMBER }}>
    {label} ›
  </button>
);

export const Verd: React.FC<{ value: string; line1: string; line2?: string; size?: number; marginTop?: number }> = ({ value, line1, line2, size = 50, marginTop = 15 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 13, marginTop }}>
    <div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.9, color: A.INK, ...FIGS }}>{value}</div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{line1}</div>
      {line2 ? <div style={{ fontSize: 11.5, color: A.DIM, marginTop: 2, ...FIGS }}>{line2}</div> : null}
    </div>
  </div>
);
