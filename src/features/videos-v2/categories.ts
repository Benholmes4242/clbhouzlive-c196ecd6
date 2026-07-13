/**
 * Category ids replicated (NOT imported) from the legacy mood system in
 * src/components/watch/videos/hooks/useVideosMood.ts. That hook maps its
 * three category moods to MOMENT_CATEGORIES ids as follows:
 *   course_vlogs -> 'course-vlog'
 *   coaching     -> 'tips-coaching'
 *   tournaments  -> 'tournament'
 * Videos v2 uses those MOMENT_CATEGORIES ids directly as its ?cat= values.
 */
export const VIDEOS_V2_CATEGORY_IDS = [
  'course-vlog',
  'tips-coaching',
  'tournament',
] as const;

export type VideosV2CategoryId = typeof VIDEOS_V2_CATEGORY_IDS[number];
