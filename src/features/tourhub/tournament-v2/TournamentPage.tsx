/**
 * TournamentPage (tournament-v2) — TD1 rebuild.
 *
 * One intelligent scroll. State-aware: upcoming / live / completed each
 * lead with their act. No tabs, no framer-motion, no shell rows.
 *
 * Reuse mandate satisfied:
 *   - useTournamentMeta          — leaderboard hook, extended select
 *   - useTourLeaderboard         — Tour Book board rows
 *   - ScorecardSheet             — the ONE drill-in sheet
 *   - useFeaturedGroups          — overview RPC
 *   - useTournamentPulse         — EventState machine
 *   - useSingleCourseImage       — hero image
 *   - useEventMoments            — moments source
 *   - useTournamentTeeTimes /
 *     useTeeTimesAll             — Round-1 tee times
 *   - useLeaderboardRealtime +
 *     useTournamentStatusRealtime — hero + board move during play
 *
 * Route entry stays as-is (TournamentDetailPage.tsx) — TD2 swaps the
 * component behind the same params.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { formatWeekdayShort, formatTimeHm } from '@/i18n/format';
import { TourHubShell } from '../components/TourHubShell';


import { useTournamentMeta } from '../leaderboard/useTournamentMeta';
import { useTourLeaderboard } from '../hooks/useTourHubData';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { useTournamentPulse } from '../components/overview-v3/useTournamentPulse';
import { useLeaderboardRealtime } from '../hooks/useLeaderboardRealtime';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';
import { useLiveTournaments } from '../hooks/useLiveTournaments';

import { HeroSection } from './sections/HeroSection';
import { SectionEyebrow } from './sections/SectionEyebrow';
import { MiniBoard } from './sections/MiniBoard';
import { FeaturedGroupsRail } from './sections/FeaturedGroupsRail';
import { TeeTimesFirstGroups } from './sections/TeeTimesFirstGroups';
import { AllTeeTimesSheet } from './sections/AllTeeTimesSheet';
import { CourseSection } from './sections/CourseSection';
import { MomentsSection } from './sections/MomentsSection';
import { EventInfoSection } from './sections/EventInfoSection';
import { StorySection } from './sections/StorySection';
import { FullBoardSheet } from './sections/FullBoardSheet';

import { useTeeTimesAll } from './data/useTeeTimesAll';
import { useFieldTop3 } from './data/useFieldTop3';
import { useTournamentStory } from './data/useTournamentStory';
import { scrollElementIntoView } from '@/lib/getScrollParent';

import {
  FONT, INK, INK_MUTE, INK_FAINT, SLATE_50, HAIRLINE_INK_8, INK_TINT_06, SURFACE,
} from '../_shared/tokens';

export function TournamentPage() {
  const { t } = useTranslation('tourhub');
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  



  const { data: meta, isLoading } = useTournamentMeta(tournamentId);
  const { data: leaderboard } = useTourLeaderboard(tournamentId ?? '');
  const { data: liveList = [] } = useLiveTournaments();
  const pulse = useTournamentPulse(tournamentId);

  // Realtime (equivalent to legacy TournamentDetailPage): board + status.
  useLeaderboardRealtime(pulse.state === 'live' ? tournamentId : null);
  useTournamentStatusRealtime();

  const venueInput = useMemo(() => {
    if (!meta) return null;
    return {
      venueName: meta.venue_name || meta.name || '',
      venueCourseName: meta.venue_course_name,
      city: meta.venue_city,
      country: meta.venue_country,
    };
  }, [meta]);
  const { courseImage } = useSingleCourseImage(venueInput);

  // Round awareness: upcoming events show round 1; live/completed use
  // the tournament's current_round so the tab=tee-times deep link never
  // shows Thursday's times on Sunday (Brief F-TD-3 §3).
  const currentRound = pulse.state === 'upcoming' ? 1 : (meta?.current_round ?? 1);
  // Lazy fetch: skip the sr_tee_times request on completed events unless
  // the tab=tee-times deep link is present (Brief F-TD-3 §4).
  const teeTimesRequested = searchParams.get('tab') === 'tee-times';
  const teeGroupsEnabled = pulse.state !== 'completed' || teeTimesRequested;
  const { data: teeGroups = [] } = useTeeTimesAll(tournamentId, currentRound, { enabled: teeGroupsEnabled });
  const { data: field } = useFieldTop3(pulse.state === 'upcoming' ? tournamentId : null);

  const [teeTimesOpen, setTeeTimesOpen] = useState(false);
  const [fullBoardOpen, setFullBoardOpen] = useState(false);

  const { data: story } = useTournamentStory(tournamentId);

  const tourCode = (meta?.tour_code ?? 'pga').toLowerCase();

  // Inbound ?tab= mapping from legacy deep links:
  //   tab=leaderboard  -> scroll to #the-act
  //   tab=tee-times    -> upcoming: scroll to #the-act (tee-times), else open sheet
  //   any other        -> ignore
  useEffect(() => {
    if (isLoading || !meta) return;
    const tab = searchParams.get('tab');
    if (!tab) return;
    if (tab === 'leaderboard') {
      requestAnimationFrame(() => {
        const el = document.getElementById('the-act');
        if (el) scrollElementIntoView(el, { behavior: 'smooth' });
      });
    } else if (tab === 'tee-times') {
      if (pulse.state === 'upcoming') {
        requestAnimationFrame(() => {
          const el = document.getElementById('the-act');
          if (el) scrollElementIntoView(el, { behavior: 'smooth' });
        });
      } else if (teeGroups.length > 0) {
        setTeeTimesOpen(true);
      }
    }
  }, [isLoading, meta, searchParams, pulse.state, teeGroups.length]);

  if (isLoading || !meta) {
    return (
      <TourHubShell immersive immersiveStatusBar>
        <div style={{ background: SLATE_50, minHeight: '100dvh' }}>
          <div className="animate-pulse" style={{
            height: 260, background: '#0A0E14',
          }} />
          <div className="animate-pulse" style={{ padding: 16 }}>
            <div style={{ height: 10, width: 90, background: INK_TINT_06, borderRadius: 4, marginBottom: 10 }} />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `0.5px solid ${HAIRLINE_INK_8}` }}>
                <div style={{ width: 28, height: 12, background: INK_TINT_06, borderRadius: 4 }} />
                <div style={{ flex: 1, height: 12, background: INK_TINT_06, borderRadius: 4 }} />
                <div style={{ width: 40, height: 12, background: INK_TINT_06, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </TourHubShell>
    );
  }

  const leaderboardRows = (leaderboard as any[] | undefined) ?? [];
  const hasBoard = leaderboardRows.length > 0;

  // Live: deep-link to the richer Leaderboards tab when this event is in
  // the live list; otherwise fall back to the house full-board sheet.
  // Completed: always open the sheet in place.
  const openFullBoard = () => {
    if (pulse.state === 'live') {
      const inLiveList = liveList.some((t: any) => t?.id === tournamentId);
      if (inLiveList) {
        navigate(`/tourhub?tab=live&event=${tournamentId}`);
        return;
      }
    }
    setFullBoardOpen(true);
  };


  return (
    <TourHubShell immersive immersiveStatusBar>
      <div style={{ background: SLATE_50, minHeight: '100dvh', fontFamily: FONT }}>
        <HeroSection
          meta={meta}
          state={pulse.state}
          imageUrl={courseImage?.imageUrl ?? null}
          tourCode={tourCode}
          leaderboard={leaderboard as any}
        />

        {/* THE ACT */}
        <section id="the-act">
          {pulse.state === 'live' && (
            <>
              {hasBoard && (
                <>
                  <SectionEyebrow kicker={t('tournament.shell.board.eyebrow')} actionLabel={t('tournament.shell.board.action')} onAction={openFullBoard} />
                  <MiniBoard tournamentId={tournamentId!} entries={leaderboardRows as any} />
                </>
              )}
              {/* Rail owns its 'On the Course' eyebrow — self-hides when
                  featured groups are absent (Brief F-TD-3 §1). */}
              <FeaturedGroupsRail tournamentId={tournamentId!} live tourCode={tourCode} />
            </>
          )}

          {pulse.state === 'upcoming' && (
            <UpcomingAct
              meta={meta}
              field={field ?? null}
              teeGroups={teeGroups}
              onOpenAllTimes={() => setTeeTimesOpen(true)}
            />
          )}

          {pulse.state === 'completed' && hasBoard && (
            <>
              <SectionEyebrow kicker={t('tournament.shell.leaderboard.finalEyebrow')} actionLabel={t('tournament.shell.leaderboard.fullBoardAction')} onAction={openFullBoard} />
              <MiniBoard tournamentId={tournamentId!} entries={leaderboardRows as any} />
            </>
          )}
        </section>

        {/* THE STORY — completed events only, self-hides w/o text */}
        {pulse.state === 'completed' && <StorySection story={story?.story ?? null} />}

        {/* EVENT INFO — always-on. Live events with tee-time coverage get a
            tappable row that opens the full tee-times sheet (Brief F-TD-4). */}
        <EventInfoSection
          meta={meta}
          broadcast={story?.broadcast ?? null}
          onTeeTimesTap={pulse.state === 'live' && teeGroups.length > 0 ? () => setTeeTimesOpen(true) : null}
          teeTimesRound={pulse.state === 'live' && teeGroups.length > 0 ? currentRound : null}
        />


        {/* THE COURSE */}
        <CourseSection tournamentId={tournamentId!} />

        {/* MOMENTS */}
        <MomentsSection tournamentId={tournamentId!} tourCode={tourCode} />

        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
      </div>

      <AllTeeTimesSheet
        open={teeTimesOpen}
        onClose={() => setTeeTimesOpen(false)}
        groups={teeGroups}
        tournamentName={meta.name}
        round={currentRound}
      />
      <FullBoardSheet
        open={fullBoardOpen}
        onClose={() => setFullBoardOpen(false)}
        tournamentId={tournamentId!}
        meta={meta}
        entries={leaderboardRows as any}
      />
    </TourHubShell>
  );
}

function UpcomingAct({
  meta, field, teeGroups, onOpenAllTimes,
}: {
  meta: NonNullable<ReturnType<typeof useTournamentMeta>['data']>;
  field: { fieldCount: number; topPlayers: { id: string; name: string; rank: number }[]; firstTeeTime: string | null } | null;
  teeGroups: import('./data/useTeeTimesAll').TeeGroup[];
  onOpenAllTimes: () => void;
}) {
  const hasField = field && field.fieldCount > 0;
  const hasTimes = teeGroups.length > 0;
  const firstTee = field?.firstTeeTime ?? teeGroups[0]?.teeTime ?? null;

  return (
    <>
      {hasField && (
        <>
          <SectionEyebrow kicker="The Field" />
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 800 }}>{field!.fieldCount}</span>
              <span style={{ color: INK_MUTE }}> players</span>
              {field!.topPlayers.length > 0 && (
                <>
                  <span style={{ color: INK_MUTE }}> · headlined by </span>
                  <span style={{ fontWeight: 700 }}>
                    {field!.topPlayers.map((p) => p.name).join(', ')}
                  </span>
                </>
              )}
              {firstTee && (
                <>
                  <span style={{ color: INK_MUTE }}> · first tee </span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {`${formatWeekdayShort(new Date(firstTee))} ${formatTimeHm(new Date(firstTee))}`}
                  </span>
                </>
              )}
              {!firstTee && meta.start_date && (
                <>
                  <span style={{ color: INK_MUTE }}> · starts in </span>
                  <span style={{ fontWeight: 700 }}>
                    {Math.max(0, differenceInCalendarDays(new Date(meta.start_date), new Date()))} days
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {hasTimes && (
        <>
          <SectionEyebrow kicker="Tee Times" actionLabel="All times" onAction={onOpenAllTimes} />
          <TeeTimesFirstGroups groups={teeGroups} limit={5} />
        </>
      )}

      {/* Empty fallback (Brief F-TD-3 §2): pre-sync upcoming events (no
          field yet, no tee times yet) get one always-on line so the act
          isn't silent under the hero. */}
      {!hasField && !hasTimes && (
        <div style={{ padding: '8px 16px 4px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: INK_MUTE, lineHeight: 1.5 }}>
            The field and tee times will appear here closer to the start.
          </div>
        </div>
      )}
    </>
  );
}

export default TournamentPage;
