/**
 * canManagePost — shared visibility gate for the post owner menu
 * (Edit / Delete / Manage review) across every surface.
 *
 * Mirrors `useEditablePost`'s server-side `canManage` resolution:
 *   • personal post → viewer is the author
 *   • business post → viewer is an owner/admin of that business
 *
 * Business membership comes from `useManageableBusinessIds`, which is a
 * single deduped query per viewer — never a per-card lookup.
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

export function canManagePost(
  post: PostOwnershipShape | null | undefined,
  viewerId: string | null | undefined,
  manageableBusinessIds: ReadonlySet<string>,
): boolean {
  if (!viewerId || !post) return false;
  if (post.actorType === 'business' && post.actorId) {
    return manageableBusinessIds.has(post.actorId);
  }
  return !!post.userId && post.userId === viewerId;
}
