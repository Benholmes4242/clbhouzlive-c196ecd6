/** BRIEF_COURSES_LATEST_FROM_COURSES §7 — the ONE builder of hole viewer
 * items. The hole walk and the Latest holes rail both open MediaPreviewViewer
 * over a hole's shots; this keeps kicker, title, credit and media fields
 * identical between them. Processing videos (null duration) are excluded.
 * Credits read added_at (when the member added the shot to clbhouz), never
 * EXIF capture. */
import type { OrderedMediaItem } from '@/components/shared/media/types';
import { holeMediaPoster } from './holePhotoData';
import { addedMonthLabel } from './addedMonth';
import { holeOrdinal } from './holeWalk';
import { shareCourseName } from '@/lib/courses/shareCourseName';
import { buildHlsUrl } from '@/utils/streamId';

export interface HoleViewerShot {
  id: string;
  media_type: string;
  media_url: string;
  poster_url?: string | null;
  stream_id?: string | null;
  duration_seconds?: number | null;
  added_at?: string | null;
  /** Display name of the member who added the shot. */
  author?: string | null;
  hole_no: number;
  par: number | null;
  yards: number | null;
}

export function buildHoleViewerItems(
  shots: readonly HoleViewerShot[],
  { courseName, scored }: { courseName?: string; scored: boolean },
): OrderedMediaItem[] {
  const { short, variant } = shareCourseName(courseName);
  const coursePart = short + (variant ? ` (${variant})` : '');
  return shots
    .filter(shot => shot.media_type !== 'video' || shot.duration_seconds != null)
    .map((shot, order) => {
      const video = shot.media_type === 'video';
      const parPart = scored ? ` · Par ${shot.par}${shot.yards != null ? ` · ${shot.yards} yards` : ''}` : '';
      const credit = [shot.author, addedMonthLabel(shot.added_at)].filter(Boolean).join(' · ');
      return {
        id: shot.id,
        type: video ? 'video' as const : 'image' as const,
        order,
        previewUrl: video ? holeMediaPoster(shot) : shot.media_url,
        thumbnailUrl: holeMediaPoster(shot),
        hlsUrl: video ? buildHlsUrl(shot.stream_id || shot.media_url) : undefined,
        caption: {
          kicker: `The ${holeOrdinal(shot.hole_no)}`,
          title: coursePart + parPart,
          credit: credit || undefined,
        },
      };
    });
}
