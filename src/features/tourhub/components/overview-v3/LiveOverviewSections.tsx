/** Tour overview LIVE STATES (state.kind 'live' | 'suspended') sections:
 * facts, the before-first-tee tee sheet and the course with field averages.
 * Reads only existing sources: tournament meta (cut/zone), the board
 * entries, sr_tee_times via useTeeTimesAll, get_tournament_course_holes and
 * get_tournament_hole_analysis. A failed read drops its section or cell. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTournamentMeta } from '../../leaderboard/useTournamentMeta';
import { useTournamentCourseHoles } from '../../tournament-v2/data/useTournamentCourseHoles';
import { useTournamentHoleAnalysis } from '../../tournament-v2/data/useTournamentHoleAnalysis';
import { useTeeTimesAll } from '../../tournament-v2/data/useTeeTimesAll';
import { AllTeeTimesSheet } from '../../tournament-v2/sections/AllTeeTimesSheet';
import { HERO_TOT_TYPE } from '../../tournament-v2/sections/HeroBoardRows';
import { getScoreColor } from '../../_shared/scoreColor';
import { surnameOf } from '../../_shared/playerName';
import { formatTimeHm24 } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { overviewQueryReady } from './overviewShells';
import { UpcomingCourse } from './UpcomingOverviewSections';
import { venueTee } from './upcomingOverviewRules';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { holeAverages, liveStage, ordinal, teeStartKey, type LiveFactCell, type LiveStage } from './liveStateRules';
import type { CourseHole } from '../../tournament-v2/data/tournamentRules';
import './HybridHeroBands/liveStates.css';

export interface LiveOverviewInput { kind: 'live' | 'suspended'; round: number; totalRounds: number; entries: BoardEntry[]; currentRoundStatus?: string | null }

/** Null input = not a live slide: every read stays disabled. */
export function useLiveOverview(id: string | null, input: LiveOverviewInput | null) {
  const on = !!id && !!input;
  const metaQuery = useTournamentMeta(on ? id : null);
  const meta = metaQuery.isError ? null : metaQuery.data ?? null;
  const result = on && input ? liveStage({ ...input, currentRoundStatus: input.currentRoundStatus ?? meta?.current_round_status ?? null, cutRound: meta?.cut_round ?? null }) : null;
  const stage = result?.stage ?? null;
  const holesQuery = useTournamentCourseHoles(on ? id ?? undefined : undefined);
  const wantAvg = on && stage != null && stage !== 'beforeTee';
  const analysisQuery = useTournamentHoleAnalysis(wantAvg ? id : null, result?.round ?? null);
  const firstTees = useTeeTimesAll(id, 1, { enabled: on && stage === 'beforeTee' });
  const ready = !on || [metaQuery, holesQuery, ...(wantAvg ? [analysisQuery] : []), ...(stage === 'beforeTee' ? [firstTees] : [])].every(q => overviewQueryReady(q));
  return {
    on, ready, meta, stage: result,
    zone: meta?.course_timezone ?? meta?.timezone ?? null,
    cut: { status: meta?.status ?? null, currentRound: meta?.current_round ?? input?.round ?? null, cutRound: meta?.cut_round ?? null, cutline: meta?.cutline ?? null, projectedCutline: meta?.projected_cutline ?? null },
    holes: holesQuery.isError ? [] : (holesQuery.data ?? []) as CourseHole[],
    analysis: wantAvg && !analysisQuery.isError && analysisQuery.data?.available ? analysisQuery.data : null,
    firstTees: !on || firstTees.isError ? [] : firstTees.data ?? [],
  };
}

export function LiveFacts({ cells }: { cells: LiveFactCell[] }) {
  const { t } = useTranslation('tourhub');
  if (cells.length === 0) return null;
  return (
    <div data-live-facts className="upcoming-event-facts live-facts">
      {cells.map(c => (
        <div key={c.key} data-live-fact={c.key}>
          <b style={{ ...HERO_TOT_TYPE, ...(c.toPar != null ? { color: getScoreColor(c.toPar, 'dark') } : {}) }}>{c.value}</b>
          {c.key === 'scoringAvg'
            ? <span><span className="live-fact-full">{t('overview.live.facts.scoringAvg')}</span><span className="live-fact-short">{t('overview.live.facts.scoringAvgShort')}</span></span>
            : <span>{t(`overview.live.facts.${c.key}`)}</span>}
        </div>
      ))}
    </div>
  );
}

export const FIRST_TEE_ROWS = 5;

export function LiveFirstTees({ groups, zone, tournamentId, tournamentName }: { groups: ReturnType<typeof useLiveOverview>['firstTees']; zone: string | null; tournamentId: string; tournamentName: string | null }) {
  const { t } = useTranslation('tourhub');
  const [open, setOpen] = useState(false);
  const valid = groups.filter(g => Number.isFinite(Date.parse(g.teeTime)));
  if (valid.length === 0) return null;
  const time = (iso: string) => venueTee(iso, zone)?.time ?? formatTimeHm24(iso);
  return (
    <section data-live-first-tees className="upcoming-sec">
      <div className="upcoming-sec-head">
        <h2 className="upcoming-sec-kick">{t('overview.live.tees.kicker')}</h2>
        <span className="upcoming-sec-kick" data-live-tee-groups>{t('overview.live.tees.groups', { count: valid.length })}</span>
      </div>
      <div className="live-tees">
        {valid.slice(0, FIRST_TEE_ROWS).map((g, i) => (
          <div key={`${g.teeTime}-${i}`} className="live-tee" data-live-tee-group>
            <b>{time(g.teeTime)}</b>
            <span>{g.players.map(p => surnameOf(p.name)).join(' · ')}<small>{t(`overview.live.tees.${teeStartKey(g.startingHole)}`)}</small></span>
          </div>
        ))}
      </div>
      <Button variant={null} size={null} data-live-all-tees style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: 'auto', minHeight: 31, padding: 0, border: 0, background: 'none', fontSize: 13, fontWeight: 600, color: 'rgba(248,250,252,.62)' }} onClick={() => setOpen(true)}><span>{t('overview.live.tees.all')}</span><span aria-hidden style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>›</span></Button>
      <AllTeeTimesSheet open={open} onClose={() => setOpen(false)} tournamentId={tournamentId} tournamentName={tournamentName} defaultRound={1} />
    </section>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <b>{children}</b>;

export function LiveCourse({ holes, tournamentId, stage, round, analysis }: { holes: CourseHole[]; tournamentId: string; stage: LiveStage; round: number; analysis: ReturnType<typeof useLiveOverview>['analysis'] }) {
  const { t } = useTranslation('tourhub');
  if (stage === 'beforeTee') return <UpcomingCourse holes={holes} tournamentId={tournamentId} />;
  const avg = analysis ? holeAverages(analysis.holes) : null;
  const usable = avg && avg.holes.some(h => h.value != null) ? avg : null;
  let lead: React.ReactNode = null;
  if (usable && usable.total != null && usable.hardest != null && usable.easiest != null && Math.round(usable.total * 100) !== 0) {
    const key = stage === 'between' ? 'played' : 'playing';
    const parts = t(`overview.live.course.${key}`, { value: Math.abs(usable.total).toFixed(2), dir: t(`overview.live.course.${usable.total < 0 ? 'under' : 'over'}`), hard: ordinal(usable.hardest), easy: ordinal(usable.easiest) }).split(/(<b>.*?<\/b>)/g).filter(Boolean);
    lead = parts.map((p, i) => p.startsWith('<b>') ? <B key={i}>{p.replace(/<\/?b>/g, '')}</B> : <span key={i}>{p}</span>);
  }
  const keyParts = t('overview.live.course.key').split(/(<b>.*?<\/b>)/g).filter(Boolean).map((p, i) => p.startsWith('<b>') ? <B key={i}>{p.replace(/<\/?b>/g, '')}</B> : <span key={i}>{p}</span>);
  return <UpcomingCourse holes={holes} tournamentId={tournamentId} live={{ kicker: t('overview.live.course.kicker', { round }), lead, averages: usable, keyLine: <span>{keyParts}</span> }} />;
}
