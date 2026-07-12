import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import {
  CLIPS_V2_MOODS,
  type ClipsV2Mood,
} from './hooks/useClipsWallFeed';
import { ClipsWall } from './components/ClipsWall';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const DEFAULT_MOOD: ClipsV2Mood = 'for_you';

const MOOD_LABELS: Record<ClipsV2Mood, string> = {
  for_you: 'For you',
  lightning: 'Lightning',
  friends: 'Friends',
  your_courses: 'Your courses',
  trending: 'Trending',
};

function parseMood(raw: string | null): ClipsV2Mood {
  return raw && (CLIPS_V2_MOODS as readonly string[]).includes(raw)
    ? (raw as ClipsV2Mood)
    : DEFAULT_MOOD;
}

export default function ClipsPageV2() {
  const [params, setParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const mood = useMemo(() => parseMood(params.get('mood')), [params]);

  const setMood = useCallback(
    (next: ClipsV2Mood) => {
      const p = new URLSearchParams(params);
      if (next === DEFAULT_MOOD) p.delete('mood');
      else p.set('mood', next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <main
        style={{
          paddingBottom: 80,
          // Pad by --header-h ONLY, not --chrome-total-h. The latter includes
          // --shell-extra-h, which leaks in from a keep-alive Clubhouse
          // ShellSlot mounted in the background and creates a growing gap on
          // return visits. This page has no ShellSlot of its own.
          paddingTop: 'var(--header-h, 55px)',
          fontFamily: FONT_FAMILY,
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#F8FAFC',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            padding: '10px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className="scrollbar-hide"
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
              }}
            >
              {CLIPS_V2_MOODS.map((id) => {
                const active = id === mood;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMood(id)}
                    style={{
                      flexShrink: 0,
                      fontWeight: 600,
                      fontSize: 12.5,
                      padding: '7px 14px',
                      borderRadius: 999,
                      background: active ? '#0F172A' : '#fff',
                      color: active ? '#fff' : '#0F172A',
                      border: active ? 'none' : '1px solid rgba(0,0,0,0.07)',
                      cursor: 'pointer',
                    }}
                  >
                    {MOOD_LABELS[id]}
                  </button>
                );
              })}
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
        </div>

        <ClipsWall mood={mood} />
      </main>

      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageRoot>
  );
}
