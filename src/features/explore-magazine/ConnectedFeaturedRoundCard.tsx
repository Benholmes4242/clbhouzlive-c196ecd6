/** Standalone featured slots own canonical actor-aware follow reads/mutations.
 * FeedCard instead passes its existing gated score-post handler directly.
 * Keeping this adapter outside FeaturedRoundCard preserves isolated rendering.
 */
import type { ComponentProps } from 'react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { FeaturedRoundCard } from './FeaturedRoundCard';

export function ConnectedFeaturedRoundCard(props: ComponentProps<typeof FeaturedRoundCard>) {
  const { activeActor } = useActiveActor();
  const viewerActorType = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? props.viewerId;
  const mine = props.viewerId === props.round.user_id;
  const { isFollowing } = useFollowState({ viewerActorType, viewerActorId, targetActorType: 'personal', targetActorId: mine ? undefined : props.round.user_id });
  const toggle = useToggleFollow();
  return <FeaturedRoundCard {...props} isFollowed={isFollowing ?? props.isFollowed} onFollow={props.viewerId && !mine ? () => {
    if (!props.viewerId || !viewerActorId || toggle.isPending || isFollowing === undefined) return;
    toggle.mutate({ viewerActorType, viewerActorId, viewerUserId: props.viewerId, targetActorType: 'personal', targetActorId: props.round.user_id, targetUserId: props.round.user_id, isFollowing });
  } : undefined} />;
}