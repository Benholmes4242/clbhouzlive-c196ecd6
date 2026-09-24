import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useHandicapTrend, useCounters } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';
import { getSyncHealth } from '@/lib/whs/syncHealth';

// ── ONE SCROLLING PAGE, LED BY THE NEXT-ROUND PROJECTION ─────────────────
// The Today / Form / Circle tabs are gone. The three view components
// (TodayView / TrendsView / CircleView) were deleted 10 Sep 2026 — their inner
// blocks mount here directly, in the fixed page order:
//
//   1 Next round · 2 Index · 3 Rounds that count · 4 Which holes cost you ·
//   5 Personal bests · 6 Your circle · 7 Trophy room · Footer provenance
//
// SECTION A IS THE SHELL ONLY. Each block below still renders its existing
// pre-rebuild UI; sections B–K replace them one at a time with the flat
// HcpSection grammar. Blocks the brief removes entirely (greeting/weather,
// achievements tile, streaks, pulse, compare entry, invite, posted-history
// panel, your-courses rail, thirds panel) stay mounted until their lettered
// section takes them off — nothing disappears before its replacement exists.
//
// `./views/*` and `./types` (HandicapSubtab, LEGACY_SUBTAB_ALIAS,
// resolveHandicapSubtab) were deleted 10 Sep 2026.

import IndexSection from './sections/IndexSection';
import NextRoundSection from './sections/NextRoundSection';
import RoundsThatCountSection from './sections/RoundsThatCountSection';
import HolesSection from './sections/HolesSection';
import PersonalBestsSection, { TrophyRoomRow } from './sections/PersonalBestsSection';
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

  const viewMode: 'owner' | 'friend' = readOnly ? 'friend' : 'owner';

  // ── handicap_viewed: one emit per (page, read_only) view. Fire-and-forget.
  // `tab` is retained as a property with the constant value 'page' so the
  // pre-cutover series (today/form/circle and the legacy five) keeps its shape
  // and the post-tab era is distinguishable rather than absent.
  /**
   * INSTRUMENTATION CUTOVER — 10 Sep 2026. `rounds_counting` CHANGES MEANING on
   * the day this ships. fetchCounters used to carry a hard `.limit(8)`, so this
   * property was the counter count CAPPED AT 8; the cap is gone, so it is now
   * the true count of rows with is_counter = true. Any chart or comparison that
   * spans 10 Sep 2026 will show a step at that date which is this change and
   * not member behaviour — read the series in two halves, as with the handicap
   * subtab cutover in Aug 2026. Eight counters is a WHS rule that applies at 20
   * or more rounds; encoding it in the query asserted it everywhere.
   */
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

      {/* 1 — HANDICAP INDEX */}
      <IndexSection connection={connection} />

      {/* 2 — NEXT ROUND */}
      <NextRoundSection connectionId={connection.id} currentHandicap={currentHandicap} />

      {/* 3 — ROUNDS THAT COUNT */}
      <RoundsThatCountSection connectionId={connection.id} userId={userId} />

      {/* 4 — HOW YOU SCORE A HOLE */}
      <HolesSection userId={userId} connectionId={connection.id} readOnly={readOnly} />

      {/* 5 — RECORDS TO BREAK */}
      <PersonalBestsSection
        connectionId={connection.id}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
        showTrophyRoom={false}
      />

      {/* StreaksCard (the ON THE LINE - {n} ACTIVE rail) is OFF this page and
          deleted 10 Sep 2026. It went with the trophies layer: the streak
          material lives in the trophy room's StreaksPanel, whose door is the
          terminal TROPHY ROOM row at the foot of Personal bests, and
          StreaksSheetMount stays at page level so ?gam=streaks still opens. */}

      {/* 6 — TROPHY ROOM */}
      {!readOnly && <TrophyRoomRow standalone />}

      {/* FOOTER — provenance only. */}
      <HandicapFooter
        membershipNumber={connection.membership_number}
      />

      {/* Sheet mounts that lived inside the old views must survive them. */}
      <LaunchSheetMount userId={userId} />
    </div>
  );
};

export default HandicapDashboard;
