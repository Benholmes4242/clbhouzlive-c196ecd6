/**
 * ComparePage - "The Duel".
 *
 * /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 *
 * Route-param contract (ported verbatim from the old CollegeComparePage):
 *   - Both params present   -> render the duel.
 *   - c1 present, c2 missing -> redirect to /tourhub/college-golf/<c1>.
 *   - Both missing           -> renders empty duel (both columns "-") with
 *                              Change buttons wired to the PickerSheet.
 *   - Unknown/invalid slug   -> column renders as "-" (no standings match);
 *                              tug bars show both-zero neutrals; Classes
 *                              hides for that side. This mirrors the old
 *                              page's silent-empty behaviour.
 *
 * Reuse:
 *   - useFranchiseStandings   -> ONE source for both sides' rank/points/
 *                               alumni/wins/top10 (matches the hub exactly).
 *   - useLiveAlumni + useLivePlayerIds -> live counts + row live dots.
 *   - useCollegeRoster        -> both classes' top alumni (already sorted
 *                               by earnings; we slice 5).
 *
 * No framer.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { collegeProfileRoute, playerRoute } from '@/features/tourhub/routes';
import { formatEarnings } from '@/features/tourhub/_shared/formatEarnings';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  CHARCOAL,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  STATUS_LIVE,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { useFranchiseStandings } from '@/features/tourhub/college-v2/hub/data/useFranchiseStandings';
import { useLiveAlumni } from '@/features/tourhub/college-v2/hub/data/useLiveAlumni';
import { useCollegeRoster } from '@/features/tourhub/college-v2/profile/data/useCollegeRoster';
import { useThisWeekAlumni, type WeekAlumnusRow } from '@/features/tourhub/college-v2/profile/data/useThisWeekAlumni';
import { useLivePlayerIds, type LivePlayerMap } from '@/features/tourhub/players-v2/data/useLivePlayerIds';
import { DuelMasthead } from './DuelMasthead';
import { AverageStatRow, CountStatRow } from './TugStat';
import { PickerSheet } from './PickerSheet';
import { useCollegeAggregateStats } from './data/useCollegeAggregateStats';
import { Skeleton } from '@/components/ui/skeleton';

const CLASS_CAP = 5;
const OFF_INK = 'rgba(248,250,252,0.38)';
const fmtInt = (n: number) => formatNumber(n);
const fmtScoringAvg = (n: number) => n.toFixed(2);
const fmtDrive = (n: number) => `${n.toFixed(1)} yds`;
const fmtSg = (n: number) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

const KICKER_STYLE = {
  padding: '18px 16px 8px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: INK,
};

function SkeletonKicker() {
  return (
    <div style={{ padding: '18px 16px 8px' }}>
      <Skeleton style={{ height: 10, width: 90, borderRadius: 3 }} />
    </div>
  );
}

function SkeletonRow({ withBar = false }: { withBar?: boolean }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Skeleton style={{ height: 16, width: 60, borderRadius: 3 }} />
        <Skeleton style={{ height: 10, width: 70, borderRadius: 3 }} />
        <Skeleton style={{ height: 16, width: 60, borderRadius: 3 }} />
      </div>
      {withBar ? (
        <Skeleton style={{ height: 4, borderRadius: 2 }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton style={{ height: 9, width: 66, borderRadius: 3 }} />
          <Skeleton style={{ height: 9, width: 66, borderRadius: 3 }} />
        </div>
      )}
    </div>
  );
}


export function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';

  // Old contract: c1 present with no c2 -> redirect to profile.
  useEffect(() => {
    if (c1 && !c2) navigate(collegeProfileRoute(c1), { replace: true });
  }, [c1, c2, navigate]);

  const { data, isLoading, isError, refetch } = useFranchiseStandings();
  const { data: liveAlumni } = useLiveAlumni();
  const { data: leftRoster = [] } = useCollegeRoster(c1 || undefined);
  const { data: rightRoster = [] } = useCollegeRoster(c2 || undefined);
  const { data: liveMap = {} } = useLivePlayerIds();
  const { data: leftWeek = [] } = useThisWeekAlumni(c1 || undefined);
  const { data: rightWeek = [] } = useThisWeekAlumni(c2 || undefined);
  const { data: leftAgg, isLoading: leftAggLoading } = useCollegeAggregateStats(c1 || undefined);
  const { data: rightAgg, isLoading: rightAggLoading } = useCollegeAggregateStats(c2 || undefined);
  const { t } = useTranslation('tourhub');


  const leftWeekByPlayer = useMemo(() => {
    const m = new Map<string, WeekAlumnusRow>();
    for (const r of leftWeek) if (!m.has(r.playerId)) m.set(r.playerId, r);
    return m;
  }, [leftWeek]);
  const rightWeekByPlayer = useMemo(() => {
    const m = new Map<string, WeekAlumnusRow>();
    for (const r of rightWeek) if (!m.has(r.playerId)) m.set(r.playerId, r);
    return m;
  }, [rightWeek]);

  const [pickerTarget, setPickerTarget] = useState<'c1' | 'c2' | null>(null);

  const standings = data?.standings ?? [];
  const left = useMemo(() => standings.find((s) => s.normalizedName === c1) ?? null, [standings, c1]);
  const right = useMemo(() => standings.find((s) => s.normalizedName === c2) ?? null, [standings, c2]);

  const liveLeft = liveAlumni?.byCollege?.[c1] ?? 0;
  const liveRight = liveAlumni?.byCollege?.[c2] ?? 0;

  const leftClass = leftRoster.slice(0, CLASS_CAP);
  const rightClass = rightRoster.slice(0, CLASS_CAP);

  const leftCode = left?.shortName || left?.collegeName?.slice(0, 4).toUpperCase() || 'LEFT';
  const rightCode = right?.shortName || right?.collegeName?.slice(0, 4).toUpperCase() || 'RIGHT';


  const leftName = left?.shortName || left?.collegeName || '';
  const rightName = right?.shortName || right?.collegeName || '';
  const year = data?.year ?? new Date().getFullYear();

  const statsLoading = isLoading && !left && !right;
  const aggLoading = leftAggLoading || rightAggLoading;
  const averageRows =
    (leftAgg?.scoringAvg || rightAgg?.scoringAvg ? 1 : 0) +
    (leftAgg?.drivingDistance || rightAgg?.drivingDistance ? 1 : 0) +
    (leftAgg?.sgTotal || rightAgg?.sgTotal ? 1 : 0);

  // Analytics: viewed once per mount, after both sides and aggregates resolve.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    if (!left || !right || aggLoading) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_college_compare_viewed', {
      left_slug: c1,
      right_slug: c2,
      left_rank: left.rank ?? null,
      right_rank: right.rank ?? null,
      average_rows: averageRows,
    });
  }, [left, right, aggLoading, c1, c2, averageRows]);

  // Analytics: a side swapped to a new college.
  const prevSlugs = useRef<{ c1: string; c2: string }>({ c1, c2 });
  useEffect(() => {
    const prev = prevSlugs.current;
    if (prev.c1 !== c1) {
      analyticsEvents.track('tour_college_compare_swapped', {
        side: 'left',
        from_slug: prev.c1,
        to_slug: c1,
      });
    }
    if (prev.c2 !== c2) {
      analyticsEvents.track('tour_college_compare_swapped', {
        side: 'right',
        from_slug: prev.c2,
        to_slug: c2,
      });
    }
    prevSlugs.current = { c1, c2 };
  }, [c1, c2]);

  const openPicker = (target: 'c1' | 'c2') => {
    setPickerTarget(target);
    analyticsEvents.track('tour_college_compare_changed', {
      side: target === 'c1' ? 'left' : 'right',
    });
  };


  // c1 && !c2 -> we're about to redirect; render nothing.
  if (c1 && !c2) return null;

  if (isError) {
    return (
      <TourHubShell immersiveStatusBar>
        <div style={{ background: SLATE_50, minHeight: '100vh', fontFamily: FONT, paddingBottom: 88 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>
              Couldn't load the duel
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: INK_MUTE, maxWidth: 280 }}>
              Check your connection and try again.
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{ background: INK, color: SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        </div>
      </TourHubShell>
    );
  }


  return (
    <TourHubShell immersiveStatusBar>
      <div
        style={{
          background: SLATE_50,
          minHeight: '100vh',
          fontFamily: FONT,
          paddingBottom: 88,
        }}
      >
        {/* Masthead - always renders (skeleton state below if loading) */}
        {isLoading && !left && !right ? (
          <div
            style={{
              background: CHARCOAL,
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 58px)',
              paddingBottom: 16,
              paddingLeft: 12,
              paddingRight: 12,
              display: 'flex',
              gap: 10,
            }}
          >
            {[0, 1].map((i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Skeleton variant="dark" style={{ width: 54, height: 54, borderRadius: '34%' }} />
                <Skeleton variant="dark" style={{ height: 10, width: 80, borderRadius: 3 }} />
                <Skeleton variant="dark" style={{ height: 8, width: 60, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        ) : (
          <DuelMasthead
            left={left}
            right={right}
            liveLeft={liveLeft}
            liveRight={liveRight}
            onChangeLeft={() => openPicker('c1')}
            onChangeRight={() => openPicker('c2')}
          />
        )}

        {/* Stats - THE SEASON (counts, tug bars) */}
        <section style={{ background: SURFACE, borderTop: `0.5px solid ${HAIRLINE_INK_10}` }}>
          {statsLoading ? (
            <>
              <SkeletonKicker />
              {[0, 1, 2, 3].map((i) => (
                <SkeletonRow key={i} withBar />
              ))}
              <SkeletonKicker />
              {[0, 1, 2].map((i) => (
                <SkeletonRow key={`a${i}`} />
              ))}
            </>
          ) : (
            <>
              <div style={KICKER_STYLE}>{t('college.compare.theSeason')}</div>
              <CountStatRow
                label={t('college.compare.earnings')}
                leftValue={left ? left.earningsTotal : null}
                rightValue={right ? right.earningsTotal : null}
                format={formatEarnings}
                leftName={leftName}
                rightName={rightName}
              />
              <CountStatRow
                label={t('college.compare.alumniOnTour')}
                leftValue={left ? left.alumniCount : null}
                rightValue={right ? right.alumniCount : null}
                format={fmtInt}
                leftName={leftName}
                rightName={rightName}
              />
              <CountStatRow
                label={t('college.compare.wins')}
                leftValue={left ? left.winsTotal : null}
                rightValue={right ? right.winsTotal : null}
                format={fmtInt}
                leftName={leftName}
                rightName={rightName}
              />
              <CountStatRow
                label={t('college.compare.top10s')}
                leftValue={left ? left.top10Total : null}
                rightValue={right ? right.top10Total : null}
                format={fmtInt}
                leftName={leftName}
                rightName={rightName}
              />
            </>
          )}
        </section>

        {/* Stats - THE NUMBERS (averages, coverage, no bars) */}
        {!statsLoading && averageRows > 0 && (
          <section style={{ background: SURFACE, marginTop: 10 }}>
            <div style={KICKER_STYLE}>{t('college.compare.theNumbers')}</div>
            {(leftAgg?.scoringAvg || rightAgg?.scoringAvg) && (
              <AverageStatRow
                label={t('college.compare.scoringAvg')}
                left={leftAgg?.scoringAvg ?? null}
                right={rightAgg?.scoringAvg ?? null}
                format={fmtScoringAvg}
                lowerWins
                leftName={leftName}
                rightName={rightName}
              />
            )}
            {(leftAgg?.drivingDistance || rightAgg?.drivingDistance) && (
              <AverageStatRow
                label={t('college.compare.drivingDistance')}
                left={leftAgg?.drivingDistance ?? null}
                right={rightAgg?.drivingDistance ?? null}
                format={fmtDrive}
                leftName={leftName}
                rightName={rightName}
              />
            )}
            {(leftAgg?.sgTotal || rightAgg?.sgTotal) && (
              <AverageStatRow
                label={t('college.compare.sgTotal')}
                left={leftAgg?.sgTotal ?? null}
                right={rightAgg?.sgTotal ?? null}
                format={fmtSg}
                leftName={leftName}
                rightName={rightName}
              />
            )}
            <div
              style={{
                padding: '10px 16px 16px',
                fontSize: 11,
                fontWeight: 500,
                color: INK_FAINT,
                textAlign: 'center',
                letterSpacing: '0.01em',
              }}
            >
              {t('college.compare.footer', { year })}
            </div>
          </section>
        )}


        {/* Classes */}
        <section style={{ background: SURFACE, marginTop: 12 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              borderTop: `0.5px solid ${HAIRLINE_INK_10}`,
            }}
          >
            <ClassColumn
              headerCode={leftCode}
              roster={leftClass}
              liveMap={liveMap}
              weekByPlayer={leftWeekByPlayer}
              alignRight={false}
            />
            <ClassColumn
              headerCode={rightCode}
              roster={rightClass}
              liveMap={liveMap}
              weekByPlayer={rightWeekByPlayer}
              alignRight
            />
          </div>
        </section>
      </div>

      <PickerSheet
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        target={pickerTarget}
        standings={standings}
        otherSlug={pickerTarget === 'c1' ? c2 : c1}
      />
    </TourHubShell>
  );
}

// ---------------------------------------------------------------------------

interface ClassColumnProps {
  headerCode: string;
  roster: Array<{
    id: string;
    fullName: string;
    photoUrl: string | null;
    firstName: string;
    lastName: string;
  }>;
  liveMap: LivePlayerMap;
  weekByPlayer: Map<string, WeekAlumnusRow>;
  alignRight: boolean;
}

function formatWeekSubline(week: WeekAlumnusRow): string {
  const pos =
    week.position != null ? `${week.positionTied ? 'T' : ''}${week.position}` : null;
  return pos ? `${pos} \u00B7 ${week.tournamentName}` : week.tournamentName;
}

function ClassColumn({ headerCode, roster, liveMap, weekByPlayer, alignRight }: ClassColumnProps) {
  return (
    <div
      style={{
        minWidth: 0, // 1fr columns must be allowed to shrink: min-content is 168 at 320
        padding: '12px 12px 16px',
        borderLeft: alignRight ? `0.5px solid ${HAIRLINE_INK_10}` : 'none',
      }}
    >
      <div
        style={{
          // AXIS 10: class-column header, a coordinate not a sentence.
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: INK_FAINT,
          textAlign: alignRight ? 'right' : 'left',
          marginBottom: 12,
        }}
      >
        {headerCode} Leads
      </div>
      {roster.length === 0 ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: INK_MUTE,
            textAlign: alignRight ? 'right' : 'left',
            paddingTop: 4,
          }}
        >
          No alumni on file
        </div>
      ) : (
        roster.map((a) => {
          const live = liveMap[a.id] ?? null;
          const week = weekByPlayer.get(a.id) ?? null;
          const nav = playerRoute(a.id, { kind: 'college', collegeName: headerCode });

          let subline: string;
          let sublineColor: string;
          if (live) {
            const posLabel =
              live.position != null
                ? `${live.positionTied ? 'T' : ''}${live.position}`
                : '';
            subline = posLabel
              ? `${posLabel} \u00B7 ${live.tournamentName}`
              : live.tournamentName;
            sublineColor = STATUS_LIVE;
          } else if (week) {
            subline = formatWeekSubline(week);
            sublineColor = INK_MUTE;
          } else {
            subline = 'Off this week';
            sublineColor = OFF_INK;
          }

          return (
            <Link
              key={a.id}
              to={nav.to}
              state={nav.state}
              style={{
                display: 'flex',
                flexDirection: alignRight ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <SquircleAvatar
                  size={26}
                  srcCandidates={a.photoUrl ? [a.photoUrl] : []}
                  alt={a.fullName}
                  hairlineRing
                  ringColor="rgba(255,255,255,0.18)"
                />
                {live && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 1,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: STATUS_LIVE,
                      boxShadow: '0 0 0 1.5px #FFFFFF',
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: alignRight ? 'right' : 'left',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {a.fullName}
                </div>
                <div
                  style={{
                    marginTop: 1,
                    fontSize: 11,
                    fontWeight: live ? 700 : 500,
                    color: sublineColor,
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: alignRight ? 'right' : 'left',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {subline}
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}

export default ComparePage;
