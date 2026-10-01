import React from 'react';
import ThumbIcon from '@/components/icons/ThumbIcon';
import { AMBER_ON_MEDIA } from '@/lib/tokens/surfaces';

/**
 * THE POST TYPE DECIDES THE REACTION (BRIEF_CELEBRATE_REACTION_BUILD).
 *
 *   ROUND      -> 'celebrate': the verb "celebrated", the larger size
 *   review     -> 'helpful':   the helpful wording
 *   everything -> 'like':      the verb "liked"
 *
 * The kind decides SIZE and WORDING, never the icon: every kind draws the
 * same thumbs-up glyph (BRIEF_ONE_REACTION_GLYPH).
 *
 * THERE IS DELIBERATELY NO REACTION-TYPE COLUMN. Neither reaction store
 * (content_reactions for members, post_likes for business actors on round
 * posts) records what kind a reaction is, and that is the design, not a gap:
 * a stored type could contradict the post it sits on (a "heart" row on a
 * round), and then the type and the post would have to be kept in step
 * forever. The subject already says what the reaction is. Derive it here —
 * do not add the column back.
 *
 * Existing counts are untouched: a round's reactions ARE its celebrations.
 */
/**
 * THE CELEBRATE ROW IS BIGGER THAN A LIKE ROW. The round reaction is the
 * primary action on a round; a like is one control among several on a photo or
 * review post. These two constants are the ONLY place either size is set.
 */
export const CELEBRATE_GLYPH_SIZE = 23;         // stacked round footers
export const CELEBRATE_GLYPH_SIZE_COMPACT = 18; // one-line Discover rows

/** The count beside a scaled glyph: size * 0.62, one decimal. */
export function celebrateFigureSize(size: number): number {
  return Math.round(size * 0.62 * 10) / 10;
}

/* ONE GLYPH, APP-WIDE (BRIEF_ONE_REACTION_GLYPH).
   Every kind draws the SAME thumbs-up (ThumbIcon); the kind decides size and
   wording only. State is WEIGHT AND COLOUR together
   (BRIEF_REACTION_GLYPH_OUTLINE_TO_FILL): idle is the regular-weight outline
   in a muted tone, reacted is the fill weight in amber. ReactionGlyph is the
   ONLY thing that decides either — a call site that picks a weight or writes
   an amber hex for this glyph is a bug. The swap is instant: never animate it. */
export type ReactionKind = 'like' | 'celebrate' | 'helpful';

export function reactionKindFor(subject: { isRound: boolean; isReview: boolean }): ReactionKind {
  if (subject.isRound) return 'celebrate';
  if (subject.isReview) return 'helpful';
  return 'like';
}

/** THE reaction amber. Declared once, here. */
export const AMBER = '#F7931E';
const IDLE_PANEL = 'rgba(255,255,255,0.72)';
const IDLE_MEDIA = '#FFFFFF';

export function ReactionGlyph({
  reacted, size, tone = 'panel', color,
}: {
  reacted: boolean;
  size: number;
  tone?: 'panel' | 'media';
  /** HelpfulReviewsShelf ONLY: inherit the row colour. Do not use elsewhere. */
  color?: string;
}) {
  return React.createElement(ThumbIcon, {
    weight: reacted ? 'fill' : 'regular',
    size,
    color: color ?? (reacted ? (tone === 'media' ? AMBER_ON_MEDIA : AMBER) : tone === 'media' ? IDLE_MEDIA : IDLE_PANEL),
    'aria-hidden': true,
  });
}

/** Legacy accessor — kept for typing; reaction controls use ReactionGlyph. */
export function reactionGlyph(_kind: ReactionKind) {
  return ThumbIcon;
}
