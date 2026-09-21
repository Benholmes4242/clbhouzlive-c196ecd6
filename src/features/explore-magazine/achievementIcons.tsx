import React from 'react';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SC_FILL_BIRDIE_DK, SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import {
  FEAT_GOLD_EMBLEM_GLOW,
  FEAT_GOLD_EMBLEM_SIZE,
  FEAT_TOP_EMBLEM_GLOW,
  FEAT_TOP_EMBLEM_SIZE,
  TOPAR_UNDER_DARK,
} from '@/features/tourhub/_shared/tokens';

/**
 * THE ACHIEVEMENT ICONS (BRIEF_EXPLORE_TWO_SHAPES §5).
 *
 * ONE FILE, and every colour is IMPORTED. A hex typed here would be a fourth
 * copy of the gold and a second copy of the under-par red, which is exactly how
 * two greens once shipped side by side. The tokens are:
 *   gold  SC_FILL_GOLD      retained as the canonical achievement gold
 *   green A.GREEN           the one analytical / movement green (rank up)
 *   red   SC_FILL_BIRDIE_DK the one birdie ring red, shared with the card
 *         (CALLOUT_RED = TOPAR_UNDER_DARK remains the tour under-par token)
 *   white A.INK             retained as the canonical achievement ink
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

/** Emoji mark for a feat. Drawn figures keep using Frame; every mark occupies
 * the same fixed lane so mixed rows share one optical baseline. */
export function AchievementEmoji({ glyph, tier = 'ink' }: { glyph: string; tier?: 'ink' | 'gold' | 'top' }) {
  const emblemSize = tier === 'top' ? FEAT_TOP_EMBLEM_SIZE : tier === 'gold' ? FEAT_GOLD_EMBLEM_SIZE : 22;
  const emblemGlow = tier === 'top' ? FEAT_TOP_EMBLEM_GLOW : tier === 'gold' ? FEAT_GOLD_EMBLEM_GLOW : 'none';
  return (
    <span
      data-explore-achievement-emoji={glyph}
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: `0 0 ${CALLOUT_ICON}px`,
        width: CALLOUT_ICON,
        height: CALLOUT_ICON,
        fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
        fontSize: emblemSize,
        lineHeight: 1,
        filter: emblemGlow,
      }}
    >
      {glyph}
    </span>
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

/** The birdie haul wears its own count: a red outline ring with a white
 * numeral, matching the scorecard card's birdie mark (1.4 user units on the
 * 24-unit box at 28px renders the card's 1.6px stroke). */
export function BirdieCountIcon({ count }: { count: number }) {
  return (
    <Frame>
      <circle cx="12" cy="12" r="10" fill="none" stroke={SC_FILL_BIRDIE_DK} strokeWidth="1.4" />
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

