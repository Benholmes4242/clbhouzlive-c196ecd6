import React from 'react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

/**
 * THE ACHIEVEMENT ICONS (BRIEF_EXPLORE_TWO_SHAPES §5).
 *
 * ONE FILE, and every colour is IMPORTED. A hex typed here would be a fourth
 * copy of the gold and a second copy of the under-par red, which is exactly how
 * two greens once shipped side by side. The tokens are:
 *   gold  SC_FILL_GOLD      the scorecard's own gold (crown, star)
 *   green A.GREEN           the one analytical / movement green (rank up)
 *   red   TOPAR_UNDER_DARK  the canonical under-par red (birdie count)
 *   white A.INK             the bogey-free shield
 */

export const CALLOUT_GOLD = SC_FILL_GOLD;
export const CALLOUT_GREEN = A.GREEN;
export const CALLOUT_RED = TOPAR_UNDER_DARK;
export const CALLOUT_INK = A.INK;

/** Every callout icon occupies the same 28px lane, whatever it draws. */
export const CALLOUT_ICON = 28;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={CALLOUT_ICON}
      height={CALLOUT_ICON}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      style={{ display: 'block', flex: `0 0 ${CALLOUT_ICON}px` }}
    >
      {children}
    </svg>
  );
}

export function CrownIcon() {
  return (
    <Frame>
      <path
        d="M3 8.5l4 3.2 5-6.7 5 6.7 4-3.2-1.7 10.2H4.7L3 8.5z"
        fill={CALLOUT_GOLD}
      />
    </Frame>
  );
}

export function RankUpIcon() {
  return (
    <Frame>
      <path
        d="M12 4.5l6.5 7h-4v8h-5v-8h-4l6.5-7z"
        fill={CALLOUT_GREEN}
      />
    </Frame>
  );
}

export function StarIcon() {
  return (
    <Frame>
      <path
        d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7L12 3.5z"
        fill={CALLOUT_GOLD}
      />
    </Frame>
  );
}

/** The birdie haul wears its own count: a red disc with a white numeral. */
export function BirdieCountIcon({ count }: { count: number }) {
  return (
    <Frame>
      <circle cx="12" cy="12" r="10" fill={CALLOUT_RED} />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="700"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
      >
        {count}
      </text>
    </Frame>
  );
}

export function ShieldCheckIcon() {
  return (
    <Frame>
      <path d="M12 3l7 2.6v5.6c0 4.2-2.9 7.6-7 9.3-4.1-1.7-7-5.1-7-9.3V5.6L12 3z" fill={CALLOUT_INK} />
      <path
        d="M8.6 12.1l2.4 2.4 4.3-4.6"
        stroke="#0d0d0d"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Frame>
  );
}
