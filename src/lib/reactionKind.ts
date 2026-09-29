import ThumbIcon from '@/components/icons/ThumbIcon';

/**
 * THE POST TYPE DECIDES THE REACTION (BRIEF_CELEBRATE_REACTION_BUILD).
 *
 *   ROUND      -> 'celebrate': the verb "celebrated", the larger size
 *   review     -> 'helpful':   the helpful wording
 *   everything -> 'like':      the verb "liked"
 *
 * The kind decides SIZE and WORDING, never the icon: every kind draws the
 * same solid thumbs-up (BRIEF_ONE_REACTION_GLYPH).
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
   Every reaction draws the same fill-weight thumbs-up (ThumbIcon). The kind
   decides size and wording, never the icon. State is COLOUR, never fill:
   idle is the solid shape in a muted tone, reacted is the same shape in amber.
   ANY NEW REACTION CONTROL TAKES ITS GLYPH FROM reactionGlyph(). A hardcoded
   icon is a bug. */
export type ReactionKind = 'like' | 'celebrate' | 'helpful';

export function reactionKindFor(subject: { isRound: boolean; isReview: boolean }): ReactionKind {
  if (subject.isRound) return 'celebrate';
  if (subject.isReview) return 'helpful';
  return 'like';
}

/** THE glyph. One for every kind — see the header. */
export function reactionGlyph(_kind: ReactionKind) {
  return ThumbIcon;
}
