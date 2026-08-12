import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { GlassHeaderPlate } from '@/components/chrome/GlassHeaderPlate';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';
import { FilterChips } from '@/components/ui/FilterChips';
import type { VideosSortId } from './types';
import { VideosFeedV2 } from './components/VideosFeedV2';
import { VIDEOS_V2_CATEGORY_IDS, type VideosV2CategoryId } from './categories';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const VALID_SORTS: readonly VideosSortId[] = ['latest', 'popular', 'following'];
const DEFAULT_SORT: VideosSortId = 'latest';

const SORT_OPTS: ReadonlyArray<{ id: VideosSortId; label: string }> = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' },
];

type CategoryFilterId = 'all' | VideosV2CategoryId;

const CATEGORY_OPTS: ReadonlyArray<{ id: CategoryFilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'course-vlog', label: 'Course vlogs' },
  { id: 'tips-coaching', label: 'Coaching' },
  { id: 'tournament', label: 'Tournaments' },
];


function parseSort(raw: string | null): VideosSortId {
  return raw && (VALID_SORTS as readonly string[]).includes(raw)
    ? (raw as VideosSortId)
    : DEFAULT_SORT;
}

function parseCategory(raw: string | null): CategoryFilterId {
  return raw && (VIDEOS_V2_CATEGORY_IDS as readonly string[]).includes(raw)
    ? (raw as VideosV2CategoryId)
    : 'all';
}

export default function VideosPageV2() {
  const [params, setParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const sort = useMemo(() => parseSort(params.get('sort')), [params]);
  const category = useMemo<CategoryFilterId>(
    () => parseCategory(params.get('cat')),
    [params],
  );

  const setSort = useCallback(
    (next: VideosSortId) => {
      const p = new URLSearchParams(params);
      if (next === DEFAULT_SORT) p.delete('sort');
      else p.set('sort', next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  const setCategory = useCallback(
    (next: CategoryFilterId) => {
      const p = new URLSearchParams(params);
      if (next === 'all') p.delete('cat');
      else p.set('cat', next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  // VideosFeedV2 expects `null` for the "All" state (unfiltered).
  const feedCategory: VideosV2CategoryId | null =
    category === 'all' ? null : category;


  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <GlassHeaderPlate />
      <main
        style={{
          paddingBottom: 88,
          // Bleed route: --header-h publishes 0 and .app-shell no longer pads
          // --sat, so the page owns clearance for the floating island (62px).
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* Sort tabs + search — scrolls away; only the category chips below are sticky. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 4px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <UnderlineTabs
              size="md"
              align="center"
              options={SORT_OPTS}
              value={sort}
              onChange={setSort}
              ariaLabel="Sort videos"
            />
          </div>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.07)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0,
              marginBottom: 6,
            }}
          >
            <Search size={15} color="#0F172A" />
          </button>
        </div>

        {/* Sticky control block. Glass treatment matches Clips + Watch. */}
        <div
          style={{
            position: 'sticky',
            top: 'var(--sat, 0px)',
            zIndex: 10,
            background: 'rgba(248,250,252,0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            padding: '8px 0 10px',
          }}
        >
          <FilterChips
            options={CATEGORY_OPTS}
            value={category}
            onChange={setCategory}
            ariaLabel="Video category filter"
          />
        </div>

        <VideosFeedV2 sort={sort} category={feedCategory} />
      </main>

      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageRoot>
  );
}
