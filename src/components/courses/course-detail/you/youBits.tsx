/**
 * BRIEF_YOU_TAB_REBUILD — the small shared parts of the You tab.
 *
 * The tab uses the SAME wrapper and heading as the Course tab (AboutSection +
 * DiscoverSectionHeading, neither modified). These are the pieces the Course
 * tab keeps privately in HowItPlays / RecordBook and that the You tab needs in
 * more than one section: a labelled figure, an honest sentence, and a
 * navigating row. Nothing here is shared outside this folder.
 */
import React from 'react';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { ABOUT_KICKER, AboutHairline, aboutFig } from '../about/AboutSection';

/** §3.1 / §3.3 — value over kicker. */
export const YouFigure: React.FC<{
  label: string;
  value: string;
  tone?: string;
  size?: number;
}> = ({ label, value, tone = A.INK, size = 21 }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ ...aboutFig(size, tone), lineHeight: 1 }}>{value}</div>
    <div style={{ ...ABOUT_KICKER, marginTop: 5, whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

/** A sentence where a figure cannot honestly go. */
export const YouSentence: React.FC<{ children: React.ReactNode; quiet?: boolean }> = ({
  children,
  quiet,
}) => (
  <p
    style={{
      margin: 0,
      fontSize: 13,
      lineHeight: 1.55,
      fontWeight: quiet ? 600 : 700,
      color: quiet ? A.MUTE : A.INK,
      fontFamily: SANS,
    }}
  >
    {children}
  </p>
);

/** The caption under the record row — 11px DIM, states the basis. */
export const YouCaption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    style={{
      margin: '12px 0 0',
      fontSize: 11,
      lineHeight: 1.5,
      fontWeight: 500,
      color: A.DIM,
      fontFamily: SANS,
      ...FIGS,
    }}
  >
    {children}
  </p>
);

/**
 * A navigating row. Every '›' on these tabs means navigation, so this is the
 * only shape a chevron takes — ported from the Course tab's drill-down row.
 */
export const YouLinkRow: React.FC<{
  label: string;
  sub?: string;
  hairline?: boolean;
  onPress: () => void;
}> = ({ label, sub, hairline = true, onPress }) => (
  <>
    {hairline ? <AboutHairline style={{ marginTop: 18 }} /> : null}
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 0,
        padding: hairline ? '14px 0 0' : '12px 0 0',
        cursor: 'pointer',
        fontFamily: SANS,
      }}
    >
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.INK }}>
        {label} ›
      </span>
      {sub ? (
        <span style={{ display: 'block', marginTop: 5, fontSize: 11, lineHeight: 1.5, color: A.DIM }}>
          {sub}
        </span>
      ) : null}
    </button>
  </>
);

/**
 * The tab's action link: 12/700/0.11em uppercase with a chevron. MUTE where the
 * action is secondary ("ALL BOARDS ›"), INK where it is the only thing to do
 * ("RATE IT ›"). Exactly as the signed-off mock draws it.
 */
export const YouAction: React.FC<{
  label: string;
  onPress: () => void;
  tone?: 'mute' | 'ink';
  space?: number;
}> = ({ label, onPress, tone = 'mute', space = 12 }) => (
  <button
    type="button"
    onClick={onPress}
    style={{
      display: 'block',
      marginTop: space,
      padding: 0,
      border: 0,
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: SANS,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.11em',
      textTransform: 'uppercase',
      color: tone === 'ink' ? A.INK : A.MUTE,
    }}
  >
    {label} ›
  </button>
);

/** A button, INK filled or hairline outlined. Used by the two invitations (§4 B/C). */
export const YouButton: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
}> = ({ label, onClick, disabled, variant = 'solid' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      marginTop: 14,
      borderRadius: 14,
      padding: variant === 'solid' ? '11px 18px' : '10px 16px',
      fontSize: variant === 'solid' ? 14 : 13,
      fontWeight: 600,
      fontFamily: SANS,
      border: variant === 'solid' ? 'none' : `1px solid ${A.HAIRLINE}`,
      background: variant === 'solid' ? A.INK : 'transparent',
      color: variant === 'solid' ? A.CANVAS : A.INK,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {label}
  </button>
);


/** "the 18th" — used by Within reach. */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
