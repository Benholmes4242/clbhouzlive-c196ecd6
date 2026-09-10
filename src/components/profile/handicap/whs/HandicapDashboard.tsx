import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useHandicapTrend, useCounters, useAllScores } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';
import { getSyncHealth } from '@/lib/whs/syncHealth';

// ── SECTION A (Sep 2026): ONE SCROLLING PAGE, TEN SECTIONS ────────────────
// The Today / Form / Circle tabs are gone. The three view components
// (TodayView / TrendsView / CircleView) are no longer rendered — their inner
// blocks mount here directly, in the fixed page order:
//
//   1 Index · 2 Next round · 3 Last round · 4 Rounds that count ·
//   5 How you're scoring · 6 Which holes cost you · 7 Personal bests ·
//   8 Your circle · 9 Friends' rounds · 10 Footer
//
// SECTION A IS THE SHELL ONLY. Each block below still renders its existing
// pre-rebuild UI; sections B–K replace them one at a time with the flat
// HcpSection grammar. Blocks the brief removes entirely (greeting/weather,
// achievements tile, streaks, pulse, compare entry, invite, posted-history
// panel, your-courses rail, thirds panel) stay mounted until their lettered
// section takes them off — nothing disappears before its replacement exists.
//
// `./views/*` and `./types` (HandicapSubtab, LEGACY_SUBTAB_ALIAS,
// resolveHandicapSubtab) are now unreferenced here — dead list, not deleted.

import IndexSection from './sections/IndexSection';
import NextRoundSection from './sections/NextRoundSection';
import LastRoundSection from './sections/LastRoundSection';
import RoundsThatCountSection from './sections/RoundsThatCountSection';
import ScoringSection from './sections/ScoringSection';
import HolesSection from './sections/HolesSection';
import PersonalBestsSection from './sections/PersonalBestsSection';
import CircleSection from './sections/CircleSection';
import RecentlyPlayedFeed from './sections/recently-played/RecentlyPlayedFeed';
import HandicapFooter from './sections/HandicapFooter';
import { LaunchSheetMount } from '../gam/launch/LaunchSheetMount';

interface Props {
  connection: WhsConnection;
  userId: string;
  /**
   * Read-only mode — when true, hides Sync now, Disconnect, the re-auth/stale
   * banners, and the invite affordances. Used when viewing a friend's
   * handicap via /handicap/:userId.
   */
  readOnly?: boolean;
  /** First name of the profile owner — threaded through for name-prefixed friend-view copy. */
  ownerFirstName?: string | null;
}

export const HandicapDashboard: React.FC<Props> = ({ connection, userId, readOnly = false, ownerFirstName = null }) => {
  // Single source of truth - see src/lib/whs/syncHealth.ts. Status only.
  const [syncHealth] = useState(() => getSyncHealth(connection));
  const reauthRequired = syncHealth.kind === 'reauth_auth';

  // ── Trend (used by hero + passed to sections as currentHandicap) ───────
  const { data: trend } = useHandicapTrend(connection.id);
  const currentHandicap = trend?.current ?? null;

  // ── Stableford scores (section 5) — same query the deleted TrendsView ran ──────────
  const { data: scores, isLoading: scoresLoading } = useAllScores(connection.id);

  const viewMode: 'owner' | 'friend' = readOnly ? 'friend' : 'owner';

  // ── handicap_viewed: one emit per (page, read_only) view. Fire-and-forget.
  // `tab` is retained as a property with the constant value 'page' so the
  // pre-cutover series (today/form/circle and the legacy five) keeps its shape
  // and the post-tab era is distinguishable rather than absent.
  const { data: counters } = useCounters(connection.id);
  const roundsCounting = counters?.length ?? null;
  const viewedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `page:${readOnly ? 1 : 0}`;
    if (viewedKeyRef.current === key) return;
    viewedKeyRef.current = key;
    analyticsEvents.track('handicap_viewed', {
      tab: 'page',
      read_only: readOnly,
      index: currentHandicap,
      rounds_counting: roundsCounting,
    });
  }, [readOnly, currentHandicap, roundsCounting]);

  const showReauthBanner = !readOnly && reauthRequired;

  return (
    /* SNAGS_01 §B: NO LOCAL NUMBER. HandicapPage already pays the shared
       CHROME_CLEARANCE (src/lib/chromeClearance.ts) — the measured island
       height plus CHROME_TOP_GAP + CHROME_BREATHING, from the island's BOTTOM
       edge — so this page-level 32 was a second, hero-sized clearance stacked
       on top of it. Removed; the shared constant is the only owner. */
    <div className="pb-10" style={{ paddingTop: 0 }}>
      {showReauthBanner && (
        <div
          className="mx-4 mt-0 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.06)', color: '#EF4444' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your stored handicap-provider credentials no longer work. We can't refresh your data. Please
            disconnect and reconnect.
          </p>
        </div>
      )}

      {/*
        THE GREETING AND WEATHER LINE IS REMOVED (Section A). TodayGreeting was deleted 10 Sep 2026.
      */}

      {/* 1 — INDEX */}
      <IndexSection connection={connection} />

      {/* 2 — NEXT ROUND (Section C) */}
      <NextRoundSection connectionId={connection.id} currentHandicap={currentHandicap} />

      {/* 3 — LAST ROUND (Section D) */}
      <LastRoundSection
        connectionId={connection.id}
        userId={userId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 4 — ROUNDS THAT COUNT (Section E). RoundsThatCountCard was deleted 10 Sep 2026: the flat section carries this slot now. */}
      <RoundsThatCountSection connectionId={connection.id} userId={userId} />

      {/* 5 — HOW YOU'RE SCORING (Section F). The points half of StablefordCard
          is deleted 10 Sep 2026; SCORE STATS is still reported, not moved. */}
      {scoresLoading ? null : <ScoringSection scores={scores ?? []} />}

      {/* 6 — HOW YOU SCORE A HOLE (Section G). The outcome distribution moves
          here from StablefordCard's SCORE STATS and the par-type rings from
          GameEverywhereCard, which is deleted 10 Sep 2026.
          RoundShapePanel is off the page: 22 of 22 eligible members get the
          "no weak stretch" verdict, so the block says nothing. */}
      <HolesSection userId={userId} connectionId={connection.id} readOnly={readOnly} />

      {/* 7 — PERSONAL BESTS (Section H). records/PersonalBests was deleted 10 Sep 2026. AchievementsPanel is now OFF this page and deleted 10 Sep 2026
          too: the terminal TROPHY ROOM › row at the foot of Personal bests is
          verified opening the room, so the tile's only reason to exist is gone.
          GamMount stays at page level, so ?gam=trophies (with &section= and
          &badge=) and the ?sheet= aliases all still resolve. */}
      <PersonalBestsSection
        connectionId={connection.id}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* StreaksCard (the ON THE LINE - {n} ACTIVE rail) is OFF this page and
          deleted 10 Sep 2026. It went with the trophies layer: the streak
          material lives in the trophy room's StreaksPanel, whose door is the
          terminal TROPHY ROOM row at the foot of Personal bests, and
          StreaksSheetMount stays at page level so ?gam=streaks still opens. */}

      {/* 8 — YOUR CIRCLE (Section I). FriendsLeaderboardSection, StandingFigures,
          CompareEntryPanel, PulseSection and CircleInviteAction are all
          deleted 10 Sep 2026: the rank is the heading, the gap is the
          sub-line, the percentile is gone, and compare is reached by tapping a
          person through the existing resolver. */}
      {!readOnly && <CircleSection userId={userId} />}

      {/* 9 — FRIENDS' ROUNDS (Section J) */}
      {!readOnly && <RecentlyPlayedFeed ownerUserId={userId} />}

      {/* 10 — FOOTER (Section K1). RoundsArchivePanel, YourCoursesRail and
          WhsConnectionCaption are deleted 10 Sep 2026: the rounds total is
          the footer link into the SAME RoundsArchiveSheet, the counters figure
          is Section E's meta, the 90-day count is Section F's meta, and the
          provenance line moves into the footer row. No second terminal link —
          TROPHY ROOM stays at the foot of Personal bests. */}
      <HandicapFooter
        connectionId={connection.id}
        userId={userId}
        membershipNumber={connection.membership_number}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* Sheet mounts that lived inside the old views must survive them. */}
      <LaunchSheetMount userId={userId} />
    </div>
  );
};

export default HandicapDashboard;
