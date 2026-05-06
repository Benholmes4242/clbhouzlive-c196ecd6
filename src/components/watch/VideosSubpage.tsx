import { useNavigate, useNavigationType } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useStickyHeaderSafeArea } from '@/hooks/useStickyHeaderSafeArea';
import { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { WatchActionsProvider } from '@/components/watch/context/WatchActionsContext';
import { Kicker } from '@/components/watch/proshop/Kicker';

import { useVideosMood } from '@/components/watch/videos/hooks/useVideosMood';
import { VideosMoodChips } from '@/components/watch/videos/VideosMoodChips';
import { VideoOfTheWeekHero } from '@/components/watch/videos/VideoOfTheWeekHero';
import { VideosContinueWatchingRail } from '@/components/watch/videos/VideosContinueWatchingRail';
import { VideosCourseAnchoredRail } from '@/components/watch/videos/VideosCourseAnchoredRail';
import { VideosCategoryRail } from '@/components/watch/videos/VideosCategoryRail';
import { VideosFollowingRail } from '@/components/watch/videos/VideosFollowingRail';
import { MoreToWatchDivider } from '@/components/watch/videos/MoreToWatchDivider';
import { VideosFullFeed } from '@/components/watch/videos/VideosFullFeed';
import { VideosSearchOverlay } from '@/components/videos-tab/VideosSearchOverlay';

const CREAM = '#F8FAFC';

/**
 * Phase 3 Pro Shop new build — Videos subpage.
 *
 * Layout (top → bottom):
 *   Editorial header (back + LONG-FORM kicker + title + subhead)
 *   Search bar (opens videos-only search overlay)
 *   VideosMoodChips (For you / Course vlogs / Coaching / Tournaments / Friends)
 *   VideoOfTheWeekHero (16:9 landscape, AI "Why we're featuring this" blurb)
 *   VideosContinueWatchingRail (long-form ≥90s, hides on empty)
 *   VideosCourseAnchoredRail (top played course, p_format='video')
 *   VideosCategoryRail (renders for course_vlogs / coaching / tournaments)
 *   VideosFollowingRail (long-form from followed creators)
 *   MoreToWatchDivider
 *   VideosFullFeed (vertical YouTube-style cards, mood-independent)
 */
export default function VideosSubpage() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useVideosMood();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { sentinelRef, paddingTop } = useStickyHeaderSafeArea();

  // Force scroll to top on mount for forward navigation.
  // Lazy-loaded subpages mount after global ScrollToTop fires against the
  // Suspense fallback, so we re-assert here. POP is left alone so the
  // browser/ScrollRestoration can restore the previous position.
  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WatchActionsProvider>
      <PageRoot className="min-h-screen" hasBottomNav={true} style={{ background: CREAM }}>
        {/* ── Editorial header + search bar (combined sticky chrome) ── */}
        <div
          className="sticky"
          style={{
            top: 0,
            zIndex: 20,
            background: CREAM,
            borderBottom: '1px solid hsl(var(--border) / 0.12)',
          }}
        >
          {/* Editorial header */}
          <div
            style={{
              padding: '14px 16px 0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <button
              onClick={() => navigate(-1)}
              className="active:scale-[0.97] transition-transform"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(15,23,42,0.06)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
              aria-label="Back"
            >
              <ChevronLeft size={20} color="#0F172A" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Kicker color="amber">Long-form</Kicker>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                Videos
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(15,23,42,0.55)',
                  margin: '4px 0 0',
                  fontWeight: 500,
                }}
              >
                Course vlogs, coaching, tournament recaps
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ padding: '14px 16px 12px' }}>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="active:scale-[0.99] transition-transform"
              style={{
                width: '100%',
                background: 'rgba(15,23,42,0.05)',
                borderRadius: 999,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Search videos"
            >
              <Search size={15} color="rgba(15,23,42,0.55)" />
              <span style={{ fontSize: 13, color: 'rgba(15,23,42,0.55)', fontWeight: 500 }}>
                Search videos by course, creator, topic…
              </span>
            </button>
          </div>
        </div>

        {/* Mood chips */}
        <VideosMoodChips active={mood} onChange={setMood} />

        {/* Editorial sections */}
        <VideoOfTheWeekHero />
        <VideosContinueWatchingRail userId={userId} />
        <VideosCourseAnchoredRail userId={userId} />
        <VideosCategoryRail userId={userId} mood={mood} />
        <VideosFollowingRail userId={userId} />

        {/* Divider + full feed (mood-independent) */}
        <MoreToWatchDivider />
        <VideosFullFeed userId={userId} />

        <ScrollToTopGlass />

        <VideosSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          userId={userId}
        />
      </PageRoot>
    </WatchActionsProvider>
  );
}
