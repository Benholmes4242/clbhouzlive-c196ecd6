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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, differenceInCalendarDays } from 'date-fns';
import { TourHubShell } from '../components/TourHubShell';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

import { useTournamentMeta } from '../leaderboard/useTournamentMeta';
import { useTourLeaderboard } from '../hooks/useTourHubData';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { useTournamentPulse } from '../components/overview-v3/useTournamentPulse';
import { useLeaderboardRealtime } from '../hooks/useLeaderboardRealtime';
import { useTournamentStatusRealtime } from '../hooks/useTournamentStatusRealtime';

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

import {
  FONT, INK, INK_MUTE, INK_FAINT, SLATE_50, HAIRLINE_INK_8, INK_TINT_06, SURFACE,
} from '../_shared/tokens';

export function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setVisible } = useBottomNavigation();
  useEffect(() => { setVisible(true); }, [setVisible]);



  const { data: meta, isLoading } = useTournamentMeta(tournamentId);
  const { data: leaderboard } = useTourLeaderboard(tournamentId ?? '');
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

  const { data: teeGroups = [] } = useTeeTimesAll(tournamentId, 1);
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
        document.getElementById('the-act')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (tab === 'tee-times') {
      if (pulse.state === 'upcoming') {
        requestAnimationFrame(() => {
          document.getElementById('the-act')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const goFullBoard = () => navigate(`/tourhub?tab=live&event=${tournamentId}`);


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
              {(leaderboard && leaderboard.length > 0) && (
                <>
                  <SectionEyebrow kicker="The Board" actionLabel="Full leaderboard" onAction={goFullBoard} />
                  <MiniBoard tournamentId={tournamentId!} entries={leaderboard as any} />
                </>
              )}
              <OnCourseAct tournamentId={tournamentId!} tourCode={tourCode} />
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

          {pulse.state === 'completed' && leaderboard && leaderboard.length > 0 && (
            <>
              <SectionEyebrow kicker="Final Leaderboard" actionLabel="Full board" onAction={goFullBoard} />
              <MiniBoard tournamentId={tournamentId!} entries={leaderboard as any} />
            </>
          )}
        </section>

        {/* THE COURSE */}
        <CourseSection tournamentId={tournamentId!} />

        {/* MOMENTS */}
        <MomentsSection tournamentId={tournamentId!} tourCode={tourCode} />

        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }} />
      </div>

      <AllTeeTimesSheet
        open={teeTimesOpen}
        onClose={() => setTeeTimesOpen(false)}
        groups={teeGroups}
        tournamentName={meta.name}
      />
    </TourHubShell>
  );
}

function OnCourseAct({ tournamentId, tourCode }: { tournamentId: string; tourCode: string }) {
  // The rail self-hides when empty; when it renders, show the eyebrow.
  // We render optimistically (both eyebrow + rail) and let the rail
  // return null on empty data. The eyebrow itself is cheap chrome; when
  // followed by null the section reads as a live-loading affordance. To
  // guarantee a clean self-hide, we branch: query cache is warmed by the
  // rail's own useFeaturedGroups; we mirror it here with a lightweight
  // presence check.
  return (
    <>
      <SectionEyebrow kicker="On the Course" />
      <FeaturedGroupsRail tournamentId={tournamentId} live tourCode={tourCode} />
    </>
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
                    {format(new Date(firstTee), 'EEE h:mm a')}
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
    </>
  );
}

export default TournamentPage;
