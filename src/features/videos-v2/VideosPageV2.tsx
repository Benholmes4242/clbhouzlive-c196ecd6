import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { SortSegment, type VideosSortId } from './components/SortSegment';
import {
  CategoryChips,
  VIDEOS_V2_CATEGORY_IDS,
  type VideosV2CategoryId,
} from './components/CategoryChips';
import { VideosFeedV2 } from './components/VideosFeedV2';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const VALID_SORTS: readonly VideosSortId[] = ['latest', 'popular', 'following'];
const DEFAULT_SORT: VideosSortId = 'latest';

function parseSort(raw: string | null): VideosSortId {
  return raw && (VALID_SORTS as readonly string[]).includes(raw)
    ? (raw as VideosSortId)
    : DEFAULT_SORT;
}

function parseCategory(raw: string | null): VideosV2CategoryId | null {
  return raw && (VIDEOS_V2_CATEGORY_IDS as readonly string[]).includes(raw)
    ? (raw as VideosV2CategoryId)
    : null;
}

export default function VideosPageV2() {
  const [params, setParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const sort = useMemo(() => parseSort(params.get('sort')), [params]);
  const category = useMemo(() => parseCategory(params.get('cat')), [params]);

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
    (next: VideosV2CategoryId | null) => {
      const p = new URLSearchParams(params);
      if (next == null) p.delete('cat');
      else p.set('cat', next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <main
        style={{
          paddingBottom: 88,
          // Pad by --header-h ONLY, not --chrome-total-h. The latter includes
          // --shell-extra-h, which leaks in from a keep-alive Clubhouse
          // ShellSlot mounted in the background and creates a growing gap on
          // return visits. This page has no ShellSlot of its own.
          paddingTop: 'var(--header-h, 55px)',
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* Sticky control block — CompactHeader supplies the back-arrow
            chrome; this is the first content on the page. */}
        <div
          style={{
            position: 'sticky',
            top: 'calc(var(--header-h, 55px) + var(--sat, 0px) - 1px)',
            zIndex: 10,
            background: '#F8FAFC',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            padding: '0 16px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <SortSegment value={sort} onChange={setSort} />
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
              }}
            >
              <Search size={15} color="#0F172A" />
            </button>
          </div>
          <CategoryChips value={category} onChange={setCategory} />
        </div>

        <VideosFeedV2 sort={sort} category={category} />
      </main>

      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageRoot>
  );
}
