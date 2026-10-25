/**
 * canManagePost — shared visibility gate for the post owner menu
 * (Edit / Delete / Manage review) across every surface.
 *
 * Mirrors `useEditablePost`'s server-side `canManage` resolution
 * (BIZ_POSTS_V1):
 *   • personal post → viewer is the author
 *   • business post → viewer is a current owner/admin of that business,
 *     or the author while they're still owner/admin/editor of it
 *
 * Business membership comes from `useManageableBusinessIds` (owner/admin)
 * and `useTeamBusinessIds` (owner/admin/editor) — single deduped queries
 * per viewer, never a per-card lookup.
 *
 * This is only a *visibility* gate. The backend (`useEditablePost` and the
 * delete path) re-checks permission on every write, so a stale or wrong
 * visibility decision can never become an authorization bug.
 */

export interface PostOwnershipShape {
  userId?: string | null;
  actorType?: 'personal' | 'business' | null;
  actorId?: string | null;
}

/** Toast message when the server refuses a post edit/delete (0 rows under RLS). */
export const POST_CHANGE_REFUSED = "You can't change this post any more.";

export function canManagePost(
  post: PostOwnershipShape | null | undefined,
  viewerId: string | null | undefined,
  manageableBusinessIds: ReadonlySet<string>,
  teamBusinessIds: ReadonlySet<string> = manageableBusinessIds,
): boolean {
  if (!viewerId || !post) return false;
  if (post.actorType === 'business' && post.actorId) {
    return (
      manageableBusinessIds.has(post.actorId) ||
      (!!post.userId && post.userId === viewerId && teamBusinessIds.has(post.actorId))
    );
  }
  return !!post.userId && post.userId === viewerId;
}
