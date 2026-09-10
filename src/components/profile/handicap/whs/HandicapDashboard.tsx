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
import GameEverywhereCard from './sections/trends/GameEverywhereCard';
import RoundShapePanel from './sections/trends/RoundShapePanel';
import PersonalBests from './sections/records/PersonalBests';
import AchievementsPanel from './sections/AchievementsPanel';
import StreaksCard from '../gam/streaks/StreaksCard';
import PulseSection from './sections/PulseSection';
import FriendsLeaderboardSection from './sections/friends-leaderboard-v2/FriendsLeaderboardSection';
import CompareEntryPanel from './sections/compare/CompareEntryPanel';
import CircleInviteAction from './sections/invite-to-clbhouz/CircleInviteAction';
import RecentlyPlayedFeed from './sections/recently-played/RecentlyPlayedFeed';
import RoundsArchivePanel from './sections/trends/RoundsArchivePanel';
import YourCoursesRail from './sections/trends/YourCoursesRail';
import WhsConnectionCaption from './sections/WhsConnectionCaption';
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

  // ── Stableford scores (section 5) — same query TrendsView ran ──────────
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
    <div className="pb-10" style={{ paddingTop: 32 }}>
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
        THE GREETING AND WEATHER LINE IS REMOVED (Section A). TodayGreeting is
        no longer rendered anywhere — dead list, not deleted.
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

      {/* 4 — ROUNDS THAT COUNT (Section E). RoundsThatCountCard is dead-listed,
          not deleted: the flat section carries this slot now. */}
      <RoundsThatCountSection connectionId={connection.id} userId={userId} />

      {/* 5 — HOW YOU'RE SCORING (Section F). The points half of StablefordCard
          is dead-listed, not deleted; SCORE STATS is still reported, not moved. */}
      {scoresLoading ? null : <ScoringSection scores={scores ?? []} />}

      {/* 6 — WHICH HOLES COST YOU (Section G; RoundShapePanel pending the
          "no weak stretch" census the brief requires before it is touched) */}
      <GameEverywhereCard readOnly={readOnly} />
      <RoundShapePanel readOnly={readOnly} />

      {/* 7 — PERSONAL BESTS (Section H; the achievements tile + streaks come
          off here, replaced by the TROPHY ROOM › terminal row per the
          amendment — GamMount itself stays at page level regardless) */}
      <PersonalBests
        connectionId={connection.id}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />
      <AchievementsPanel userId={userId} viewMode={viewMode} ownerFirstName={ownerFirstName} />
      {!readOnly && <StreaksCard userId={userId} readOnly={readOnly} />}

      {/* 8 — YOUR CIRCLE (Section I; compare entry, pulse search and invite
          come off here — compare moves onto the person row tap) */}
      {!readOnly && (
        <FriendsLeaderboardSection
          userId={userId}
          viewMode="owner"
          ownerFirstName={ownerFirstName}
        />
      )}
      <CompareEntryPanel viewerUserId={userId} readOnly={readOnly} />
      {!readOnly && <PulseSection userId={userId} />}
      {!readOnly && <CircleInviteAction ownerUserId={userId} />}

      {/* 9 — FRIENDS' ROUNDS (Section J) */}
      {!readOnly && <RecentlyPlayedFeed ownerUserId={userId} />}

      {/* 10 — FOOTER (Section K; the posted-history panel becomes the
          "All rounds" footer link, the caption and your-courses rail come off) */}
      <RoundsArchivePanel
        connectionId={connection.id}
        userId={userId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />
      <YourCoursesRail readOnly={readOnly} />

      {!readOnly && (
        <WhsConnectionCaption membershipNumber={connection.membership_number} />
      )}

      {/* Sheet mounts that lived inside the old views must survive them. */}
      <LaunchSheetMount userId={userId} />
    </div>
  );
};

export default HandicapDashboard;
