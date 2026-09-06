import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { GlassHeaderPlate } from '@/components/chrome/GlassHeaderPlate';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { RailChips } from '@/components/ui/RailChips';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import {
  CLIPS_V2_MOODS,
  type ClipsV2Mood,
} from './hooks/useClipsWallFeed';
import { ClipsWall } from './components/ClipsWall';


const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const DEFAULT_MOOD: ClipsV2Mood = 'for_you';

const MOOD_LABELS: Record<ClipsV2Mood, string> = {
  for_you: 'For you',
  lightning: 'Lightning',
  friends: 'Friends',
  your_courses: 'Your courses',
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

  const moodOptions = useMemo(
    () => CLIPS_V2_MOODS.map((id) => ({ id, label: MOOD_LABELS[id] })),
    [],
  );

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
        <div
          style={{
            position: 'sticky',
            top: 'var(--sat, 0px)',
            zIndex: 10,
            background: A.CANVAS,
            borderBottom: `1px solid ${A.BORDER}`,
            padding: '8px 4px 10px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <RailChips
                options={moodOptions}
                value={mood}
                onChange={(next) => setMood(next as ClipsV2Mood)}
                ariaLabel="Clips mood filter"
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
                border: `1px solid ${A.BORDER}`,
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Search size={15} color={A.MUTE} />
            </button>
          </div>
        </div>


        <ClipsWall mood={mood} />
      </main>

      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageRoot>
  );
}
