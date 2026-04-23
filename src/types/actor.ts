/**
 * Actor type definitions for identity system
 * Supports personal profiles and business accounts
 */

export type ActorType = 'personal' | 'business';

export interface ActiveActor {
  type: ActorType;
  id: string;
  name: string;
  avatarUrl?: string | null;
  slug?: string | null;
  verified?: boolean;
  meta?: Record<string, unknown>;
}

export interface SetActorOptions {
  /** Default true - set false for session-only override */
  persist?: boolean;
}

/**
 * Get the route path for an actor
 */
export function getActorRoute(actor: ActiveActor): string {
  switch (actor.type) {
    case 'personal':
      return `/profile/${actor.id}`;
    case 'business':
      return actor.slug ? `/business/${actor.slug}` : `/business/${actor.id}`;
    default:
      return '/';
  }
}

/**
 * Get the route path for an actor, given just its type, id, and optional slug.
 * Use this when the caller doesn't have a full ActiveActor object — most common
 * for click handlers reading actorType/actorId from a post or comment row.
 */
export function getActorRouteByType(
  actorType: ActorType | string | null | undefined,
  actorId: string | null | undefined,
  slug?: string | null,
): string {
  if (!actorId) return '/';
  if (actorType === 'business') {
    return slug ? `/business/${slug}` : `/business/${actorId}`;
  }
  // Default to personal for 'personal', null, undefined, or unknown types.
  // 'system' actors (e.g., Clbhouz announcements) also fall here — they don't
  // have a profile to route to, so '/profile/:id' is acceptable as a safe no-op
  // (the personal profile route handles "not found" gracefully).
  return `/profile/${actorId}`;
}

/**
 * Get display label for actor type
 */
export function getActorTypeLabel(type: ActorType): string {
  switch (type) {
    case 'personal':
      return 'Personal profile';
    case 'business':
      return 'Business';
    default:
      return '';
  }
}
