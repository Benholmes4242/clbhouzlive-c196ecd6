/** WS2 — open the canonical full-screen viewer on one tile with its whole loaded list, so swipe moves through the rest. */
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { toHubRow, type WatchVideoRow } from './watchMiddle';

export function openVideoList(list: WatchVideoRow[], index: number) {
  const row = list[index];
  openWithOrigin({
    posts: toFeedPosts(list.map(toHubRow)),
    index,
    originEl: null,
    posterUrl: row?.poster_url ?? null,
    openedFrom: 'amateur-watch',
    forceStartAtZero: true,
  });
}
