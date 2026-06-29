// usePendingPostsForActor — selects pending posts visible to the
// current author+viewer identity, with belt-and-braces de-dupe against
// the real feed rows.
//
// Authoring rule: a pending post is visible on a profile/feed only when
// BOTH match:
//   - the pending entry's author actor === the profile/feed actor (or matches
//     the "show on my own feed" gate)
//   - the pending entry's viewer actor === the currently-active viewing actor
//
// De-dupe rule: if a pending entry has a postId that is already present in
// the supplied real-feed list, hide the pending entry (avoids the swap flash).

import { useMemo } from 'react';
import { usePendingPostsStore, type PendingPost } from './pendingPostsStore';

interface Params {
  authorActorType: 'personal' | 'business';
  authorActorId: string;
  viewerActorType: 'personal' | 'business';
  viewerActorId: string;
  /** Real feed post ids — used to de-dupe pending entries whose row arrived. */
  realPostIds?: ReadonlyArray<string>;
}

export function usePendingPostsForActor({
  authorActorType,
  authorActorId,
  viewerActorType,
  viewerActorId,
  realPostIds,
}: Params): PendingPost[] {
  const byJobId = usePendingPostsStore((s) => s.byJobId);

  return useMemo(() => {
    const realSet = realPostIds ? new Set(realPostIds) : null;
    const out: PendingPost[] = [];
    for (const entry of Object.values(byJobId)) {
      if (entry.actorType !== authorActorType) continue;
      if (entry.actorId !== authorActorId) continue;
      if (entry.viewerActorType !== viewerActorType) continue;
      if (entry.viewerActorId !== viewerActorId) continue;
      if (entry.postId && realSet?.has(entry.postId)) continue;
      out.push(entry);
    }
    // Newest first
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  }, [byJobId, authorActorType, authorActorId, viewerActorType, viewerActorId, realPostIds]);
}
