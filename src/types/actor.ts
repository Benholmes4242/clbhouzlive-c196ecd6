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
