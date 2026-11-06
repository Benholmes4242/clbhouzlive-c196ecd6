/** Post-success and upload completion refresh the author's actual profile grid,
 * including inactive cached grids, rather than relying on refetchOnMount.
 * The profile prefix includes every viewer-actor suffix; the business legacy
 * actor-posts prefix includes its v2 suffix. No Clubhouse feed rule is changed.
 */
import type { QueryClient } from '@tanstack/react-query';
import { postKeys } from '@/queryKeys/posts';

export async function refreshAuthorPosts(queryClient: QueryClient, actorType: 'personal' | 'business', actorId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: postKeys.profilePosts(actorType, actorId), refetchType: 'all' }),
    ...(actorType === 'business'
      ? [queryClient.invalidateQueries({ queryKey: postKeys.actorPosts(actorType, actorId), refetchType: 'all' })]
      : []),
  ]);
}