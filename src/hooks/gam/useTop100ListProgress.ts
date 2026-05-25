import { useGamRpc } from './_useGamRpc';

export interface Top100CourseProgress {
  course_id: string;
  course_name: string;
  thumbnail_image: string | null;
  country: string | null;
  region: string | null;
  rank: number | null;
  is_owner_played: boolean;
  is_viewer_played: boolean;
}

/**
 * Fetches all courses in a Top 100 list with per-user played status.
 *
 * `ownerUserId` is the Trophy Room owner (whose collection is being viewed).
 * `viewerUserId` is the person looking — same as owner for self-view, friend
 * for friend-view. The query returns both played-state flags so the UI can
 * show "you have played N of these" overlays when viewing a friend.
 */
export function useTop100ListProgress(
  listSlug: string | undefined,
  ownerUserId: string | undefined,
  viewerUserId: string | undefined,
) {
  const enabled = Boolean(listSlug && ownerUserId && viewerUserId);
  return useGamRpc<Top100CourseProgress[]>(
    'get_top100_list_progress',
    enabled
      ? {
          p_list_slug: listSlug!,
          p_owner_user_id: ownerUserId!,
          p_viewer_user_id: viewerUserId!,
        }
      : ({} as {
          p_list_slug: string;
          p_owner_user_id: string;
          p_viewer_user_id: string;
        }),
    { enabled, staleTime: 60_000 },
  );
}
