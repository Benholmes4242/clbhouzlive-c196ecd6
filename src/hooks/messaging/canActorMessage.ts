/**
 * Single messaging permission gate.
 *
 * All "can this actor message that actor" decisions in messaging v2 MUST
 * route through this pure function. Keeping the logic isolated means the
 * upcoming v2 credits work is a one-branch change (business -> personal).
 *
 * v2: gate business -> personal on credit balance here.
 */

export type MessagePermission =
  | { allowed: true; mode?: 'intro' }
  | { allowed: false; reason: string };

export interface ActorRef {
  actorType: 'personal' | 'business';
}

export function canActorMessage(
  from: ActorRef,
  to: ActorRef,
): MessagePermission {
  // personal -> anyone
  if (from.actorType === 'personal') {
    return { allowed: true };
  }
  // business -> personal: allowed but framed as an intro (metered-mindset).
  // v2: gate on credit balance here.
  if (from.actorType === 'business' && to.actorType === 'personal') {
    return { allowed: true, mode: 'intro' };
  }
  // business -> business
  if (from.actorType === 'business' && to.actorType === 'business') {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Messaging not available' };
}
