/**
 * THE READER RULE FOR content_reactions (actor_type/actor_id since the actor
 * migration; unique key = target_type, target_id, actor_type, actor_id).
 *
 *   - A COUNT counts every actor. A business's like is a like.
 *   - "DID I REACT" is about the ACTIVE ACTOR, never user_id. user_id on a
 *     business row is the human who tapped it.
 *   - A LIKER LIST shows the ACTOR (business name/logo), not the human.
 *
 * Legacy rows with null actor fields are personal and belong to user_id.
 */
export type ReactionActorType = 'personal' | 'business';

export interface ReactionActorRow {
  user_id: string;
  actor_type?: string | null;
  actor_id?: string | null;
}

export function reactionActorOf(r: ReactionActorRow): { type: ReactionActorType; id: string } {
  const type: ReactionActorType = r.actor_type === 'business' ? 'business' : 'personal';
  return { type, id: r.actor_id ?? r.user_id };
}

/**
 * THE ACTIVE ACTOR, resolved once for every reader: business when acting as a
 * business, personal (the member's own id) otherwise; null when signed out.
 */
export function resolveReactionActor(
  activeActor: { type?: string | null; id?: string | null } | null | undefined,
  viewerId: string | null | undefined,
): { type: ReactionActorType | null; id: string | null } {
  if (!viewerId) return { type: null, id: null };
  return {
    type: activeActor?.type === 'business' ? 'business' : 'personal',
    id: activeActor?.id ?? viewerId,
  };
}

/** True when the row was made by exactly this actor. */
export function isReactionByActor(
  r: ReactionActorRow,
  actorType: ReactionActorType | null,
  actorId: string | null,
): boolean {
  if (!actorType || !actorId) return false;
  const a = reactionActorOf(r);
  return a.type === actorType && a.id === actorId;
}
