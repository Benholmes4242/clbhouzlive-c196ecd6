/** CB50: one viewport-centred indicator, outside media fitting/borrow transforms.
 * Only the active media's actual lane is observed; no rail/preview consumer.
 */
import React from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { BufferingSpinner } from '@/components/media/BufferingSpinner';
import { expectedOwnerKey } from './scrubberMath';
export function FullscreenBuffering({ activePost }: { activePost: FeedPost | null }) {
  const idx = useFullscreenFeedStore((s) => s.activePagerIdx);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const isOpen = useFullscreenFeedStore((s) => s.isOpen);
  const active = isOpen && activePost?.mediaItems?.[idx]?.type === 'video';
  const laneId = borrow?.postId === activePost?.id && borrow ? borrow.laneId : 'fullscreen';
  return <BufferingSpinner laneId={laneId} ownerKey={expectedOwnerKey(activePost?.id, idx)} active={!!active} fullscreen />;
}