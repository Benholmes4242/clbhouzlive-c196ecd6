import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageRoot } from '@/components/layout/PageRoot';
import { GlassHeaderPlate } from '@/components/chrome/GlassHeaderPlate';
import type { VideosSortId } from './types';
import { VideosFeedV2 } from './components/VideosFeedV2';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const VALID_SORTS: readonly VideosSortId[] = ['latest', 'popular', 'following'];
const DEFAULT_SORT: VideosSortId = 'latest';

function parseSort(raw: string | null): VideosSortId {
  return raw && (VALID_SORTS as readonly string[]).includes(raw)
    ? (raw as VideosSortId)
    : DEFAULT_SORT;
}

/**
 * BRIEF_VIDEOS_REFINE_REMOVAL: this page is header island + videos. Both chip
 * rows (sort and category) and the page's own search circle are GONE:
 *
 *   - Zero of 28 members ever changed a refine chip on Discover. Members do not
 *     narrow a view they are already looking at; they scroll it. At 28 videos
 *     the whole library is one scroll, so there is nothing to narrow.
 *   - ONE search per surface, and it is the header island's magnifier. The
 *     circle at the end of the sort row was a second door to the same job.
 *
 * Revisit the CATEGORY row (not sort, not a second search) when the library
 * passes roughly 120 videos — about four to five scroll-screens, the point at
 * which a member can no longer hold the whole set in view. Put instrumentation
 * on the chips from the first commit that reinstates them.
 *
 * `?sort=` is still honoured because inbound links carry it; there is simply no
 * control to change it here.
 */
export default function VideosPageV2() {
  const [params] = useSearchParams();
  const sort = useMemo(() => parseSort(params.get('sort')), [params]);

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <GlassHeaderPlate />
      <main
        style={{
          paddingBottom: 'var(--bottom-nav-height, 96px)',
          // Bleed route: --header-h publishes 0 and .app-shell no longer pads
          // --sat, so the page owns clearance for the floating island (62px).
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
          fontFamily: FONT_FAMILY,
        }}
      >
        <VideosFeedV2 sort={sort} category={null} />
      </main>
    </PageRoot>
  );
}
