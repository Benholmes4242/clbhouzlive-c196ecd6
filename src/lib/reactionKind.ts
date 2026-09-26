import { ThumbsUp } from 'lucide-react';
import ClapIcon from '@/components/icons/ClapIcon';

/**
 * THE POST TYPE DECIDES THE REACTION (BRIEF_CELEBRATE_REACTION_BUILD).
 *
 *   ROUND      -> 'celebrate': the clap glyph, the verb "celebrated"
 *   everything -> 'like':      the thumbs-up glyph, the verb "liked"
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

/* TWO GLYPHS, APP-WIDE.
     clap    CELEBRATE  a round — an achievement, and you celebrate it
     thumbs  LIKE       everything else
   The clap is the ONLY exception, and it earns it: a score is not a thing
   someone made, and "loved" was the wrong word for it. Everything else —
   photos, videos, stories, news, reviews, comments — is a like, and a
   thumbs-up is the glyph for a like.
   ANY NEW REACTION CONTROL TAKES ITS GLYPH FROM reactionGlyph(). A
   hardcoded lucide Heart is a bug: fourteen of them had to be swept out
   of this app once. */
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
  return ThumbsUp;
}
