import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import PageRoot from '@/components/layout/PageRoot';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import { WatchActionsProvider } from './context/WatchActionsContext';

import { Kicker } from './proshop/Kicker';
import { ClipsMoodChips } from './clips/ClipsMoodChips';
import { useClipsMood } from './clips/hooks/useClipsMood';
import { ClipOfTheWeekHero } from './clips/ClipOfTheWeekHero';
import { LightningRoundRail } from './clips/LightningRoundRail';
import { ClipsCourseAnchoredRail } from './clips/ClipsCourseAnchoredRail';
import { ClipsMostLovedRail } from './clips/ClipsMostLovedRail';
import { MoreToExploreDivider } from './clips/MoreToExploreDivider';

const CREAM = '#F5F1EA';

/**
 * Phase 2 Pro Shop rebuild of the Clips subpage.
 *
 * Layout (top → bottom):
 *   Header (back + title + subhead)
 *   ClipsMoodChips (sticky? no — scrolls with page)
 *   ClipOfTheWeekHero (emerald kicker, portrait card, AI blurb)
 *   LightningRoundRail (≤30s, hides on empty)
 *   ClipsCourseAnchoredRail (top played course, hides if no fresh clips)
 *   ClipsMostLovedRail (mixed clips, monthly window)
 *   MoreToExploreDivider
 *   WatchAutoplay + WatchGrid (existing 2-col masonry, unchanged)
 *
 * The masonry feed stays mood-independent on purpose — it's the full
 * personalised "everything else" surface. Mood chips drive the four
 * editorial sections only.
 */
export default function ClipsSubpage() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood, setMood } = useClipsMood();
  const gridRef = useRef<HTMLDivElement>(null);

  // Bottom mosaic feed — always personalised, never bound to mood.
  const {
    posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch,
  } = useWatchFeed({ userId, filter: 'trending' });

  return (
    <WatchActionsProvider>
      <PageRoot className="min-h-screen" hasBottomNav={true} style={{ background: CREAM }}>
        {/* ── Editorial header ── */}
        <div
          style={{
            padding: '14px 16px 0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            background: CREAM,
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
            <Kicker color="amber">Short-form</Kicker>
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
              Clips
            </h1>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(15,23,42,0.55)',
                margin: '4px 0 12px',
                fontWeight: 500,
              }}
            >
              Quick golf moments, all under 90 seconds
            </p>
          </div>
        </div>

        {/* ── Mood chips ── */}
        <ClipsMoodChips active={mood} onChange={setMood} />

        {/* ── Editorial sections ── */}
        <ClipOfTheWeekHero />
        <LightningRoundRail userId={userId} mood={mood} />
        <ClipsCourseAnchoredRail userId={userId} mood={mood} />
        <ClipsMostLovedRail userId={userId} mood={mood} />

        {/* ── Divider ── */}
        <MoreToExploreDivider />

        {/* ── Existing 2-col masonry (mood-independent) ── */}
        <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
        <WatchGrid
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
          userId={userId}
        />

        <ScrollToTopGlass />
      </PageRoot>
    </WatchActionsProvider>
  );
}
