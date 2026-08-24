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
import { OnTheCourse } from '../_shared/OnTheCourse';
import { TeeTimesFirstGroups } from './sections/TeeTimesFirstGroups';
import { AllTeeTimesSheet } from './sections/AllTeeTimesSheet';
import { TeeTimesRail } from './sections/TeeTimesRail';
import { CourseSection } from './sections/CourseSection';
import { useDrawnRounds } from './data/useDrawnRounds';
import { MomentsSection } from './sections/MomentsSection';
import { EventInfoSection } from './sections/EventInfoSection';
import { StorySection } from './sections/StorySection';
import { FullBoardSheet } from './sections/FullBoardSheet';

import { useTeeTimesAll } from './data/useTeeTimesAll';
import { useFieldTop3 } from './data/useFieldTop3';
import { useTournamentStory } from './data/useTournamentStory';
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentPageSkeleton } from '@/components/skeletons/TournamentPageSkeleton';

import {
  FONT, INK, INK_MUTE, INK_FAINT, SLATE_50, HAIRLINE_INK_8, SURFACE,
} from '../_shared/tokens';

export function TournamentPage() {
  const { t } = useTranslation('tourhub');
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  



  const pulse = useTournamentPulse(tournamentId);

  const { data: meta, isLoading, isError: isMetaError, refetch: refetchMeta } =
    useTournamentMeta(tournamentId, { live: pulse.state === 'live' });
  const { data: leaderboard } = useTourLeaderboard(tournamentId ?? '');
  const { data: liveList = [] } = useLiveTournaments();

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
  // Tee-time availability is data-driven: a draw publishes hours before the
  // round rolls over at venue-local midnight.
  const { data: drawnRoundsData } = useDrawnRounds(tournamentId);
  const drawnRounds = drawnRoundsData ?? [];
  const highestDrawnRound = drawnRounds.length ? Math.max(...drawnRounds) : null;
  // Lazy fetch: skip the sr_tee_times request on completed events unless
  // the tab=tee-times deep link is present (Brief F-TD-3 §4).
  const teeTimesRequested = searchParams.get('tab') === 'tee-times';
  const teeGroupsEnabled = pulse.state !== 'completed' || teeTimesRequested;
  const { data: teeGroups = [], isLoading: teesLoading } = useTeeTimesAll(tournamentId, currentRound, { enabled: teeGroupsEnabled });
  const { data: field, isLoading: fieldLoading } = useFieldTop3(pulse.state === 'upcoming' ? tournamentId : null);

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

  if (isMetaError) {
    return (
      <TourHubShell immersive immersiveStatusBar>
        <div style={{
          background: SLATE_50, minHeight: '100dvh', fontFamily: FONT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 10 }}>
              {t('tournament.error.title')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: INK_MUTE, lineHeight: 1.55, marginBottom: 18 }}>
              {t('tournament.error.body')}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => refetchMeta()}
                style={{
                  background: INK, color: SLATE_50, border: 'none', borderRadius: 999,
                  padding: '10px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: FONT, letterSpacing: '0.02em',
                }}
              >
                {t('tournament.error.retry')}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  background: 'transparent', color: INK, border: `0.5px solid ${HAIRLINE_INK_8}`,
                  borderRadius: 999, padding: '10px 18px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT, letterSpacing: '0.02em',
                }}
              >
                {t('tournament.error.back')}
              </button>
            </div>
          </div>
        </div>
      </TourHubShell>
    );
  }

  if (isLoading || !meta) {
    return (
      <TourHubShell immersive immersiveStatusBar>
        <TournamentPageSkeleton />
      </TourHubShell>
    );
  }

  const leaderboardRows = leaderboard ?? [];
  const hasBoard = leaderboardRows.length > 0;

  // Live: deep-link to the richer Leaderboards tab when this event is in
  // the live list; otherwise fall back to the house full-board sheet.
  // Completed: always open the sheet in place.
  const openFullBoard = () => {
    if (pulse.state === 'live') {
      const inLiveList = liveList.some((tRow) => tRow?.id === tournamentId);
      if (inLiveList) {
        navigate(`/tourhub?tab=live&event=${tournamentId}`, { state: { from: 'tournament' } });
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
          leaderboard={leaderboard}
        />

        {/* THE ACT */}
        <section id="the-act">
          {pulse.state === 'live' && (
            <>
              {hasBoard && (
                <>
                  <SectionEyebrow kicker={t('tournament.shell.board.eyebrow')} actionLabel={t('tournament.shell.board.action')} onAction={openFullBoard} />
                  <MiniBoard tournamentId={tournamentId!} entries={leaderboardRows} currentRound={meta?.current_round ?? null} />
                </>
              )}
              {/* Shared OnTheCourse — featured groups + FULL FIELD expander,
                  live-score-joined. Self-hides when no featured groups. */}
              <OnTheCourse tournamentId={tournamentId!} live tourCode={tourCode} />
            </>
          )}

          {pulse.state === 'upcoming' && (
            <UpcomingAct
              meta={meta}
              field={field ?? null}
              teeGroups={teeGroups}
              loading={Boolean(fieldLoading || teesLoading)}
              onOpenAllTimes={() => setTeeTimesOpen(true)}
            />
          )}

          {pulse.state === 'completed' && hasBoard && (
            <>
              <SectionEyebrow kicker={t('tournament.shell.leaderboard.finalEyebrow')} actionLabel={t('tournament.shell.leaderboard.fullBoardAction')} onAction={openFullBoard} />
              <MiniBoard tournamentId={tournamentId!} entries={leaderboardRows} currentRound={meta?.current_round ?? null} />
            </>
          )}
        </section>

        {/* THE STORY — completed events only, self-hides w/o text */}
        {pulse.state === 'completed' && <StorySection story={story?.story ?? null} />}

        {/* TEE TIMES BAND — promoted entry point to the round-by-round
            sheet. Renders for live + upcoming states only. */}
        {(pulse.state === 'live' || pulse.state === 'upcoming') && (
          <TeeTimesRail
            groups={teeGroups}
            round={currentRound}
            onOpenAll={() => setTeeTimesOpen(true)}
          />
        )}

        {/* EVENT INFO — always-on. */}
        <EventInfoSection meta={meta} broadcast={story?.broadcast ?? null} />


        {/* THE COURSE */}
        <CourseSection tournamentId={tournamentId!} />

        {/* MOMENTS */}
        <MomentsSection tournamentId={tournamentId!} tourCode={tourCode} />

        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} />
      </div>

      <AllTeeTimesSheet
        open={teeTimesOpen}
        onClose={() => setTeeTimesOpen(false)}
        tournamentId={tournamentId!}
        tournamentName={meta.name}
        defaultRound={currentRound}
        maxAvailableRound={pulse.state === 'upcoming' ? 1 : (highestDrawnRound ?? meta?.current_round ?? currentRound)}
        drawnRounds={pulse.state === 'upcoming' && drawnRounds.length === 0 ? [1] : drawnRounds}
        entries={leaderboardRows}

      />
      <FullBoardSheet
        open={fullBoardOpen}
        onClose={() => setFullBoardOpen(false)}
        tournamentId={tournamentId!}
        meta={meta}
        entries={leaderboardRows}
      />
    </TourHubShell>
  );
}

function UpcomingAct({
  meta, field, teeGroups, loading, onOpenAllTimes,
}: {
  meta: NonNullable<ReturnType<typeof useTournamentMeta>['data']>;
  field: { fieldCount: number; topPlayers: { id: string; name: string; rank: number }[]; firstTeeTime: string | null } | null;
  teeGroups: import('./data/useTeeTimesAll').TeeGroup[];
  loading: boolean;
  onOpenAllTimes: () => void;
}) {
  const { t } = useTranslation('tourhub');
  const hasField = field && field.fieldCount > 0;
  const hasTimes = teeGroups.length > 0;
  const firstTee = field?.firstTeeTime ?? teeGroups[0]?.teeTime ?? null;
  const daysToStart = meta.start_date
    ? Math.max(0, differenceInCalendarDays(new Date(meta.start_date), new Date()))
    : 0;

  return (
    <>
      {hasField && (
        <>
          <SectionEyebrow kicker={t('tournament.shell.field.eyebrow')} />
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 700 }}>{field!.fieldCount}</span>
              <span style={{ color: INK_MUTE }}>{t('tournament.shell.field.playersSuffix')}</span>
              {field!.topPlayers.length > 0 && (
                <>
                  <span style={{ color: INK_MUTE }}>{t('tournament.shell.field.headlinedBySep')}</span>
                  <span style={{ fontWeight: 700 }}>
                    {field!.topPlayers.map((p) => p.name).join(', ')}
                  </span>
                </>
              )}
              {firstTee && (
                <>
                  <span style={{ color: INK_MUTE }}>{t('tournament.shell.field.firstTeeSep')}</span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    {`${formatWeekdayShort(new Date(firstTee))} ${formatTimeHm(new Date(firstTee))}`}
                  </span>
                </>
              )}
              {!firstTee && meta.start_date && (
                <>
                  <span style={{ color: INK_MUTE }}>{t('tournament.shell.field.startsInSep')}</span>
                  <span style={{ fontWeight: 700 }}>
                    {daysToStart}{t('tournament.shell.field.daysSuffix', { count: daysToStart })}
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {hasTimes && (
        <>
          <SectionEyebrow kicker={t('tournament.shell.teeTimes.eyebrow')} actionLabel={t('tournament.shell.teeTimes.allAction')} onAction={onOpenAllTimes} />
          <TeeTimesFirstGroups groups={teeGroups} limit={5} />
        </>
      )}

      {/* Empty fallback (Brief F-TD-3 §2): pre-sync upcoming events (no
          field yet, no tee times yet) get one always-on line so the act
          isn't silent under the hero. */}
      {loading && !hasField && !hasTimes ? (
        <div style={{ padding: '8px 16px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ width: '85%', height: 12, borderRadius: 4 }} />
          <Skeleton style={{ width: '60%', height: 12, borderRadius: 4 }} />
        </div>
      ) : !hasField && !hasTimes ? (
        <div style={{ padding: '8px 16px 4px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: INK_MUTE, lineHeight: 1.5 }}>
            {t('tournament.shell.field.emptyFallback')}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default TournamentPage;
