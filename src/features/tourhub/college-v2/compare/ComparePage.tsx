/**
 * ComparePage — "The Duel".
 *
 * /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 *
 * Route-param contract (ported verbatim from the old CollegeComparePage):
 *   - Both params present   → render the duel.
 *   - c1 present, c2 missing → redirect to /tourhub/college-golf/<c1>.
 *   - Both missing           → renders empty duel (both columns "—") with
 *                              Change buttons wired to the PickerSheet.
 *   - Unknown/invalid slug   → column renders as "—" (no standings match);
 *                              tug bars show both-zero neutrals; Classes
 *                              hides for that side. This mirrors the old
 *                              page's silent-empty behaviour.
 *
 * Reuse:
 *   - useFranchiseStandings   → ONE source for both sides' rank/points/
 *                               alumni/wins/top10 (matches the hub exactly).
 *   - useLiveAlumni + useLivePlayerIds → live counts + row live dots.
 *   - useCollegeRoster        → both classes' top alumni (already sorted
 *                               by earnings; we slice 5).
 *
 * No framer.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TourHubShell } from '@/features/tourhub/components/TourHubShell';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { collegeProfileRoute, playerRoute } from '@/features/tourhub/routes';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatNumber } from '@/i18n/format';
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
import { TugStat } from './TugStat';
import { PickerSheet } from './PickerSheet';
import { useCollegeAggregateStats } from './data/useCollegeAggregateStats';

const CLASS_CAP = 5;
const OFF_INK = 'rgba(15,23,42,0.38)';
const fmtInt = (n: number) => formatNumber(n);
const fmtScoringAvg = (n: number) => (n > 0 ? n.toFixed(2) : '0.00');
const fmtDrive = (n: number) => (n > 0 ? `${n.toFixed(1)} yds` : '0.0 yds');
const fmtSg = (n: number) => (n === 0 ? '0.00' : (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2)));

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';

  // Old contract: c1 present with no c2 → redirect to profile.
  useEffect(() => {
    if (c1 && !c2) navigate(collegeProfileRoute(c1), { replace: true });
  }, [c1, c2, navigate]);

  const { data, isLoading } = useFranchiseStandings();
  const { data: liveAlumni } = useLiveAlumni();
  const { data: leftRoster = [] } = useCollegeRoster(c1 || undefined);
  const { data: rightRoster = [] } = useCollegeRoster(c2 || undefined);
  const { data: liveMap = {} } = useLivePlayerIds();
  const { data: leftWeek = [] } = useThisWeekAlumni(c1 || undefined);
  const { data: rightWeek = [] } = useThisWeekAlumni(c2 || undefined);
  const { data: leftAgg } = useCollegeAggregateStats(c1 || undefined);
  const { data: rightAgg } = useCollegeAggregateStats(c2 || undefined);

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

  // c1 && !c2 → we're about to redirect; render nothing.
  if (c1 && !c2) return null;

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
        {/* Masthead — always renders (skeleton state below if loading) */}
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
                <div style={{ width: 54, height: 54, borderRadius: '34%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ height: 10, width: 80, background: 'rgba(255,255,255,0.10)' }} />
                <div style={{ height: 8, width: 60, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
          </div>
        ) : (
          <DuelMasthead
            left={left}
            right={right}
            liveLeft={liveLeft}
            liveRight={liveRight}
            onChangeLeft={() => setPickerTarget('c1')}
            onChangeRight={() => setPickerTarget('c2')}
          />
        )}

        {/* Stats */}
        <section style={{ background: SURFACE, borderTop: `0.5px solid ${HAIRLINE_INK_10}` }}>
          {isLoading && !left && !right ? (
            <div>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ padding: '12px 16px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ height: 14, width: 60, background: 'rgba(15,23,42,0.06)', borderRadius: 3 }} />
                    <div style={{ height: 10, width: 70, background: 'rgba(15,23,42,0.05)', borderRadius: 3 }} />
                    <div style={{ height: 14, width: 60, background: 'rgba(15,23,42,0.06)', borderRadius: 3 }} />
                  </div>
                  <div style={{ height: 4, background: 'rgba(15,23,42,0.05)', borderRadius: 2 }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <TugStat
                label="Franchise Points"
                leftValue={left?.pointsTotal ?? 0}
                rightValue={right?.pointsTotal ?? 0}
                format={formatCurrency}
              />
              <div style={{ height: 0.5, background: HAIRLINE_INK_10, margin: '0 16px' }} />
              <TugStat
                label="Alumni on Tour"
                leftValue={left?.alumniCount ?? 0}
                rightValue={right?.alumniCount ?? 0}
                format={fmtInt}
              />
              <div style={{ height: 0.5, background: HAIRLINE_INK_10, margin: '0 16px' }} />
              <TugStat
                label="Wins"
                leftValue={left?.winsTotal ?? 0}
                rightValue={right?.winsTotal ?? 0}
                format={fmtInt}
              />
              <div style={{ height: 0.5, background: HAIRLINE_INK_10, margin: '0 16px' }} />
              <TugStat
                label="Top 10s"
                leftValue={left?.top10Total ?? 0}
                rightValue={right?.top10Total ?? 0}
                format={fmtInt}
              />
              {(leftAgg?.scoringAvg || rightAgg?.scoringAvg) && (
                <>
                  <div style={{ height: 0.5, background: HAIRLINE_INK_10, margin: '0 16px' }} />
                  <TugStat
                    label="Scoring Avg"
                    leftValue={leftAgg?.scoringAvg?.value ?? 0}
                    rightValue={rightAgg?.scoringAvg?.value ?? 0}
                    format={fmtScoringAvg}
                    lowerWins
                  />
                </>
              )}
              {(leftAgg?.drivingDistance || rightAgg?.drivingDistance) && (
                <>
                  <div style={{ height: 0.5, background: HAIRLINE_INK_10, margin: '0 16px' }} />
                  <TugStat
                    label="Driving Distance"
                    leftValue={leftAgg?.drivingDistance?.value ?? 0}
                    rightValue={rightAgg?.drivingDistance?.value ?? 0}
                    format={fmtDrive}
                  />
                </>
              )}
              {(leftAgg?.sgTotal || rightAgg?.sgTotal) && (
                <>
                  <div style={{ height: 0.5, background: HAIRLINE_INK_10, margin: '0 16px' }} />
                  <TugStat
                    label="SG: Total"
                    leftValue={leftAgg?.sgTotal?.value ?? 0}
                    rightValue={rightAgg?.sgTotal?.value ?? 0}
                    format={fmtSg}
                  />
                </>
              )}
            </>
          )}
        </section>

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
        padding: '12px 12px 16px',
        borderLeft: alignRight ? `0.5px solid ${HAIRLINE_INK_10}` : 'none',
      }}
    >
      <div
        style={{
          fontSize: 8.5,
          fontWeight: 800,
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
                  ringColor="rgba(15,23,42,0.12)"
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
                    fontSize: 10,
                    fontWeight: live ? 700 : 500,
                    color: sublineColor,
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: alignRight ? 'right' : 'left',
                    fontVariantNumeric: 'tabular-nums',
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
