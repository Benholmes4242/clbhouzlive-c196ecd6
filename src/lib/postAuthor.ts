/**
 * postAuthor — THE ONE RULE FOR WHO A POST IS BY.
 *
 * Standing rule (Ben): a post from a business account (actor_type 'business')
 * shows EVERYWHERE as that business — name, logo, verified tick, and the tap
 * opens the business page — NEVER as the personal account that uploaded it.
 *
 * Every post row shape in the app carries some subset of these fields:
 *   actor type : post_actor_type ?? actor_type ?? actorType
 *   actor id   : post_actor_id ?? actor_id ?? actorId ?? post_user_id
 *   business   : business_name / business_logo_url / business_is_verified
 *   personal   : creator_display_name / creator_username / creator_avatar_url /
 *                creator_is_verified (or the normalized displayName/avatarUrl/
 *                username/isVerified on a FeedPost)
 *
 * creator_* is NEVER read for a business post: on a raw RPC row those columns
 * can be the uploader's personal profile, so a business with no logo would
 * show the uploader's photo. A business with no business_* fields renders
 * with an empty name and a null avatar (the dark initials fallback), never
 * the uploader.
 *
 * feedMapper already applies this rule to normalized FeedPosts; this helper
 * exists for every renderer that reads a RAW row (Watch tiles, hub rows,
 * community rails) so the selection can never drift between surfaces.
 *
 * A business author NEVER has a handle: the uploader's @username must not
 * appear anywhere on a business post.
 */

export interface PostAuthor {
  kind: 'business' | 'personal';
  /** Business id for business posts, profile id for personal posts. */
  id: string;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
  /** Always null for business posts — never the uploader's username. */
  handle: string | null;
}

/** Loose row shape: any post row, raw RPC row, or normalized FeedPost. */
export interface PostAuthorRow {
  post_actor_type?: string | null;
  actor_type?: string | null;
  actorType?: string | null;
  post_actor_id?: string | null;
  actor_id?: string | null;
  actorId?: string | null;
  post_user_id?: string | null;
  userId?: string | null;
  business_name?: string | null;
  businessName?: string | null;
  business_logo_url?: string | null;
  businessLogoUrl?: string | null;
  business_is_verified?: boolean | null;
  creator_display_name?: string | null;
  creator_username?: string | null;
  creator_avatar_url?: string | null;
  creator_is_verified?: boolean | null;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean | null;
}

export function postAuthor(row: PostAuthorRow): PostAuthor {
  const kind: PostAuthor['kind'] =
    (row.post_actor_type ?? row.actor_type ?? row.actorType ?? 'personal') === 'business'
      ? 'business'
      : 'personal';
  const id =
    row.post_actor_id ?? row.actor_id ?? row.actorId ?? row.post_user_id ?? row.userId ?? '';

  if (kind === 'business') {
    return {
      kind,
      id,
      name:
        row.business_name ??
        row.businessName ??
        row.displayName ??
        '',
      avatarUrl:
        row.business_logo_url ?? row.businessLogoUrl ?? row.avatarUrl ?? null,
      isVerified: !!(row.business_is_verified ?? row.isVerified),
      handle: null,
    };
  }

  return {
    kind,
    id,
    name:
      row.creator_display_name ??
      row.displayName ??
      row.creator_username ??
      row.username ??
      '',
    avatarUrl: row.creator_avatar_url ?? row.avatarUrl ?? null,
    isVerified: !!(row.creator_is_verified ?? row.isVerified),
    handle: row.creator_username ?? row.username ?? null,
  };
}

/** The route an author tap opens: the business page for a business post. */
export function postAuthorRoute(author: PostAuthor): string {
  if (!author.id) return '/';
  return author.kind === 'business' ? `/business/${author.id}` : `/profile/${author.id}`;
}
