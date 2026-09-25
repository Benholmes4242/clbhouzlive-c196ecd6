import { Heart } from 'lucide-react';
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
export type ReactionKind = 'like' | 'celebrate';

export function reactionKindFor(subject: { isRound: boolean }): ReactionKind {
  return subject.isRound ? 'celebrate' : 'like';
}

/** The glyph for a kind. Both accept lucide-shaped props (size, color, fill). */
export function reactionGlyph(kind: ReactionKind) {
  return kind === 'celebrate' ? ClapIcon : Heart;
}
