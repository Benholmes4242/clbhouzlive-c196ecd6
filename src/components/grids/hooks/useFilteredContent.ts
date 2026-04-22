/**
 * useFilteredContent - Filters posts by content type
 *
 * Phase 4: Reads `derived_format` (server-computed) as the single source of truth.
 * Falls back to duration-based classification only when derived_format is absent
 * (e.g., a stale cache row from before the column shipped).
 *
 * Boundary rules (from src/constants/videoRules.ts and the data layer):
 *   - clip   = video, duration_seconds <= 90
 *   - video  = video, duration_seconds >  90
 *   - image  = image
 *
 * Profile grids historically used a 4-minute (240s) "long-form" threshold for
 * the local filter chip. We keep that local UI semantic — the chip on the
 * profile grid is for *display grouping*, not the platform-wide format
 * boundary that powers the Watch / Clips / Videos surfaces.
 */

import { useMemo } from 'react';
import { ContentFilter, GridPost } from '../types';

// Profile-grid-only display threshold — distinct from the platform's 90s
// Clips/Videos boundary. Do not change without product alignment.
const LONG_FORM_THRESHOLD = 240;

export function useFilteredContent(posts: GridPost[], filter: ContentFilter): GridPost[] {
  return useMemo(() => {
    if (filter === 'all') return posts;

    return posts.filter(post => {
      const media = post.post_media?.[0] as
        | (GridPost['post_media'] extends (infer U)[] | undefined ? U : never)
        | undefined;
      if (!media) return false;

      // Prefer the server-computed format when present.
      const derivedFormat = (media as { derived_format?: string | null }).derived_format ?? null;

      switch (filter) {
        case 'longform':
          if (derivedFormat) {
            // Platform format = 'video' (>90s). Profile chip historically gates
            // at 240s; keep that gate by combining with duration check.
            return (
              derivedFormat === 'video' &&
              media.duration_seconds != null &&
              media.duration_seconds >= LONG_FORM_THRESHOLD
            );
          }
          return (
            media.media_type === 'video' &&
            media.duration_seconds != null &&
            media.duration_seconds >= LONG_FORM_THRESHOLD
          );

        case 'shorts':
          if (derivedFormat) {
            // Anything below the 240s profile threshold (clips + short videos)
            return (
              (derivedFormat === 'clip' || derivedFormat === 'video') &&
              media.duration_seconds != null &&
              media.duration_seconds > 0 &&
              media.duration_seconds < LONG_FORM_THRESHOLD
            );
          }
          return (
            media.media_type === 'video' &&
            media.duration_seconds != null &&
            media.duration_seconds > 0 &&
            media.duration_seconds < LONG_FORM_THRESHOLD
          );

        case 'images':
          if (derivedFormat) return derivedFormat === 'image';
          return media.media_type === 'image';

        default:
          return true;
      }
    });
  }, [posts, filter]);
}
