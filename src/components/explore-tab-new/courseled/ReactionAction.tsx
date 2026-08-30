import React from 'react';
import { Heart } from 'lucide-react';

import { A, FIGS, SANS } from './tokens';

/**
 * REACTION ACTION (BRIEF_DISCOVER_REACTIONS, section 2).
 *
 * Reuses the app's canonical like affordance — the lucide `Heart` glyph with an
 * AMBER active state, exactly as the feed footer button uses it (see
 * FooterButton in src/components/posts-tab/LightFeedCard.tsx) — so members
 * learn one vocabulary, not two.
 *
 *   not reacted   outline glyph, MUTE on light / white at 72% on photography
 *   reacted       FILLED AMBER (the one legitimate amber here: filled = you)
 *   count         beside the glyph, tabular, HIDDEN ENTIRELY at zero
 *   own content   the count alone, no tappable glyph
 *   signed out    not rendered at all (the caller passes readOnly=false only
 *                 when a viewer exists; `hidden` short-circuits everything)
 *
 * 44px tap target via padding, cancelled with a negative margin so the control
 * never disturbs the row or tile it sits in. Always stopPropagation so the
 * card's own tap never fires.
 */

const WHITE_72 = 'rgba(255,255,255,0.72)';
/** On-dark amber: #F7931E does not hold on photography. */
const AMBER_ON_DARK = '#FFB25E';

interface Props {
  count: number;
  reacted: boolean;
  onToggle: () => void;
  label: string;
  /** 'ink' = light row/panel; 'glass' = over photography. */
  tone?: 'ink' | 'glass';
  /** Own content: the count renders, the glyph is not tappable. */
  readOnly?: boolean;
  /** Missing target id, signed out, or table unavailable: render nothing. */
  hidden?: boolean;
  size?: number;
  /**
   * RESERVES THE COUNT COLUMN whether or not a count renders, so the GLYPH
   * itself lands on the same x on every row of a column — not just the slot's
   * right edge (BRIEF_STANDOUT_TILE_MARGIN §5b). Off by default: the friends
   * rail reads in a single row and must not gain the dead width.
   */
  reserveCount?: boolean;
}

export function ReactionAction({
  count,
  reacted,
  onToggle,
  label,
  tone = 'ink',
  readOnly = false,
  hidden = false,
  size = 15,
  reserveCount = false,
}: Props) {
  if (hidden) return null;

  const glass = tone === 'glass';
  const idle = glass ? WHITE_72 : A.MUTE;
  const amber = glass ? AMBER_ON_DARK : A.AMBER;
  const countColor = reacted ? amber : glass ? WHITE_72 : A.MUTE;

  const figure =
    count > 0 || reserveCount ? (
      <span
        style={{
          ...FIGS,
          fontSize: 11.5,
          fontWeight: 700,
          color: countColor,
          lineHeight: 1,
          ...(reserveCount ? { minWidth: 13, textAlign: 'left' as const } : null),
        }}
      >
        {count > 0 ? count : ''}
      </span>
    ) : null;

  // OWN CONTENT — the same glyph/count treatment without a tappable wrapper.
  if (readOnly) {
    return (
      <span
        aria-label={label}
        style={{
          display: 'inline-flex',
         flexDirection: reserveCount ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 4,
          fontFamily: SANS,
        }}
      >
        <Heart size={size} strokeWidth={2} color={idle} fill="none" aria-hidden />
        {figure}
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={reacted}
      onClick={(ev: React.MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        onToggle();
      }}
      onKeyDown={(ev: React.KeyboardEvent) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.stopPropagation();
        ev.preventDefault();
        onToggle();
      }}
      style={{
        display: 'inline-flex',
       flexDirection: reserveCount ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 4,
        fontFamily: SANS,
        cursor: 'pointer',
        // 44px tap target without a layout footprint.
        padding: '13px 10px',
        margin: '-13px -10px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Heart
        size={size}
        strokeWidth={2}
        color={reacted ? amber : idle}
        fill={reacted ? amber : 'none'}
        aria-hidden
      />
      {figure}
    </span>
  );
}

/**
 * REACTION SLOT — the fixed-width trailing column every row in a section
 * reserves, whether or not it renders a control.
 *
 * Rows with the heart used to eat horizontal space that rows without it kept,
 * so figures went ragged down a card. The slot is always present: an empty one
 * renders nothing but still occupies its width, so the figure axis is identical
 * on every row.
 *
 * WIDTH: 34px — the 15px glyph + 4px gap + a reserved two-digit count at
 * 11.5px/700. The count may disappear, but the glyph axis never moves.
 */
export const REACTION_SLOT_W = 34;

export function ReactionSlot({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: REACTION_SLOT_W,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </div>
  );
}

export default ReactionAction;
