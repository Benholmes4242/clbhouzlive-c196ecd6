/** BRIEF_COURSE_TAB_1A — shared pieces for the verdict and defends-par sections. */
import React from 'react';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';

export const TILE_FILL = inkWithAlpha(SURFACE.dark.ink, 0.05);
export const BAR_NEUTRAL = inkWithAlpha(SURFACE.dark.ink, 0.28);
export const PAR_FILL = inkWithAlpha(SURFACE.dark.ink, 0.4);

export const SMALL_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: A.DIM,
  fontFamily: SANS,
  lineHeight: 1.3,
};

/** The derived observation line: rule on the left, bold for the findings. */
export const Said: React.FC<{ quiet?: boolean; children: React.ReactNode }> = ({ quiet, children }) => (
  <p
    style={{
      margin: '14px 0 0',
      fontSize: 12.5,
      lineHeight: 1.55,
      color: quiet ? A.MUTE : A.BODY,
      borderLeft: `2px solid ${quiet ? A.HAIRLINE : A.AMBER}`,
      paddingLeft: 11,
      fontFamily: SANS,
      ...FIGS,
    }}
  >
    {children}
  </p>
);

export const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <b style={{ color: A.INK, fontWeight: 700 }}>{children}</b>
);
