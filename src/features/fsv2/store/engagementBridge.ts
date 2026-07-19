/**
 * engagementBridge — subscribes once at module scope to the app's
 * engagement bus and patches in-viewer post snapshots when it's open.
 *
 * V1 mirrors this in `fullscreenFeedStore` (spec §5). Wiring it now
 * means fsv2 never falls out of sync with likes/comments touched from
 * other surfaces while a post is being viewed.
 */

import { engagementBus } from '@/lib/engagementBus';
import { applyEngagementDelta } from '@/lib/applyEngagementDelta';

import { useFsv2Store } from './fsv2Store';

let started = false;

export function startFsv2EngagementBridge(): void {
  if (started) return;
  started = true;

  engagementBus.on(({ postId, delta }) => {
    const state = useFsv2Store.getState();
    if (!state.isOpen) return;
    state.patchPost(postId, (post) => applyEngagementDelta(post, postId, delta));
  });
}
