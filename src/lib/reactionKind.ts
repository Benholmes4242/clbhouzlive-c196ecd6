import { Heart, ThumbsUp } from 'lucide-react';
import ClapIcon from '@/components/icons/ClapIcon';

/**
 * THE POST TYPE DECIDES THE REACTION (BRIEF_CELEBRATE_REACTION_BUILD).
 *
 *   ROUND      -> 'celebrate': the clap glyph, the verb "celebrated"
 *   everything -> 'like':      the heart glyph, the verb "liked"
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
 * THE CELEBRATE ROW IS BIGGER THAN A LIKE ROW. The clap is the primary
 * action on a round; the heart is one control among several on a photo or
 * review post. These two constants are the ONLY place either size is set.
 */
export const CELEBRATE_GLYPH_SIZE = 23;         // stacked round footers
export const CELEBRATE_GLYPH_SIZE_COMPACT = 18; // one-line Discover rows

/** The count beside a scaled glyph: size * 0.62, one decimal. */
export function celebrateFigureSize(size: number): number {
  return Math.round(size * 0.62 * 10) / 10;
}

/* THE SUBJECT DECIDES THE GLYPH, AND EVERY GLYPH MATCHES A VERB THE DATA
   ALREADY USES:
     clap   CELEBRATE  an achievement            -> a round
     thumb  LIKE/HELPFUL an opinion              -> a comment, a review
     heart  LIKE       something made or shared  -> a photo, video, story
   A review is an opinion with a score: the useful signal on it is
   agreement, which is why the code already calls it isHelpful. */
export type ReactionKind = 'like' | 'celebrate' | 'helpful';

export function reactionKindFor(subject: { isRound: boolean; isReview: boolean }): ReactionKind {
  if (subject.isRound) return 'celebrate';
  if (subject.isReview) return 'helpful';
  return 'like';
}

/** The glyph for a kind. All accept lucide-shaped props (size, color, fill). */
export function reactionGlyph(kind: ReactionKind) {
  if (kind === 'celebrate') return ClapIcon;
  if (kind === 'helpful') return ThumbsUp;
  return Heart;
}
