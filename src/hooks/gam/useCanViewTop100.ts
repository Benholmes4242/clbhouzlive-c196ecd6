import { useGamRpc } from './_useGamRpc';

/**
 * Whether the viewer may see the owner's Top 100 course lists.
 *
 * Needed beside useTop100ListProgress because a gated owner returns ZERO rows
 * from the progress RPC, which is otherwise indistinguishable from an empty list.
 */
export function useCanViewTop100(ownerUserId: string | undefined, viewerUserId: string | undefined) {
  const enabled = Boolean(ownerUserId && viewerUserId);
  return useGamRpc<boolean>(
    'can_view_top100',
    enabled
      ? { p_owner_user_id: ownerUserId!, p_viewer_user_id: viewerUserId! }
      : ({} as { p_owner_user_id: string; p_viewer_user_id: string }),
    { enabled, staleTime: 60_000 },
  );
}
