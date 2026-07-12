import React, { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { useWatchHubCounts } from '@/features/watch-v2/hooks/useWatchHubCounts';
import { formatCount } from '@/features/watch-v2/utils/formatCount';
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
  const navigate = useNavigate();
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

  const { data: counts, isLoading: countsLoading } = useWatchHubCounts();
  const showCount = !countsLoading && counts != null;
  const countText = showCount ? `\u00B7 ${formatCount(counts!.video_count)}` : '';

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <main
        style={{
          paddingBottom: 80,
          paddingTop: 'calc(var(--chrome-total-h, 0px) - var(--sat, 0px))',
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '2px 16px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 20,
              lineHeight: 1,
              color: '#0F172A',
              fontFamily: FONT_FAMILY,
            }}
          >
            {'\u2039'}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: '0.16em',
                color: '#c97a10',
                textTransform: 'uppercase',
                fontFamily: FONT_FAMILY,
              }}
            >
              FULL LENGTH
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                fontFamily: FONT_FAMILY,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                }}
              >
                Videos
              </span>
              {showCount && (
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#64748B',
                  }}
                >
                  {countText}
                </span>
              )}
            </div>
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

        {/* Sticky control block */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#F8FAFC',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            padding: '4px 16px 10px',
          }}
        >
          <SortSegment value={sort} onChange={setSort} />
          <CategoryChips value={category} onChange={setCategory} />
        </div>

        {/* V2.2: feed mounts here */}
      </main>

      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageRoot>
  );
}
