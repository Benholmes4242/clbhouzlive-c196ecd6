/** Loop tab feed mode. 'latest' | 'popular' map to the get_friends_feed RPC.
 *  'live_now' is a UI-level filter — it queries 'latest' under the hood and
 *  client-filters posts to authors who are currently active (is_active_recently). */
export type LoopMode = 'latest' | 'popular' | 'live_now';

/** RPC-supported subset (see useFriendsFeed). */
export type FriendsRpcMode = 'latest' | 'popular';

export function loopModeToRpcMode(mode: LoopMode): FriendsRpcMode {
  return mode === 'live_now' ? 'latest' : mode;
}
