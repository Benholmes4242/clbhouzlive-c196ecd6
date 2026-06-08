/**
 * HoleStatsTab - Flat dispatch hole-by-hole statistics
 */

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourHoleStats } from '../../hooks/useTourHubData';
import { AMBER, FONT, HAIRLINE_INK_8, HAIRLINE_INK_10, INK, INK_FAINT, INK_MUTE, INK_TINT_02, INK_TINT_06, INK_TINT_07, SURFACE, TREND_DOWN } from '../../_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';

// Local hole-distribution ramp (mirrors src/features/courses/components/holes/_constants.ts).
// Duplicated intentionally to keep tourhub self-contained — no cross-feature import.
const C_BIRDIE = '#9F1D1D';  // red — birdie or better (good = red)
const C_PAR    = '#94A3B8';  // slate — par
const C_BOGEY  = '#0F172A';  // ink — bogey (over par = dark)
const C_DOUBLE = '#475569';  // slate-600 — double or worse (muted dark)
const INK_HOLE = '#0F172A';

interface HoleStatsTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  isCompleted?: boolean;
  courseId?: string | null;
  courseName?: string | null;
}

interface ProcessedHole {
  holeNumber: number;
  par: number;
  yardage: number | null;
  scoringAverage: number;
  avgDiff: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  other: number;
  totalPlayers: number;
  difficultyRank: number;
  _scoreSum: number;
  _scoreCount: number;
  _diffSum: number;
  _diffCount: number;
}

function HoleStatsSkeleton() {
  return (
    <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
      {/* Section rule skeleton */}
      <div className="animate-pulse" style={{ padding: '14px 20px 10px' }}>
        <div style={{ height: '9px', width: '180px', background: INK_TINT_06, borderRadius: '4px' }} />
      </div>
      {/* 3-col summary strip skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ padding: '11px 0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px', borderRight: i < 2 ? `0.5px solid ${INK_TINT_07}` : 'none' }}>
            <div style={{ width: '50px', height: '8px', background: INK_TINT_06, borderRadius: '4px' }} />
            <div style={{ width: '60px', height: '15px', background: INK_TINT_06, borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      {/* Column header skeleton */}
      <div style={{ height: '28px', background: INK_TINT_02, borderBottom: `0.5px solid ${INK_TINT_07}` }} />
      {/* Hole rows */}
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: i < 8 ? `0.5px solid ${INK_TINT_07}` : 'none', gap: '8px' }}>
          <div style={{ width: '28px', height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
          <div style={{ width: '24px', height: '11px', background: INK_TINT_06, borderRadius: '4px' }} />
          <div style={{ width: '40px', height: '10px', background: INK_TINT_06, borderRadius: '4px' }} />
          <div style={{ flex: 1, height: '6px', background: INK_TINT_06, borderRadius: '3px' }} />
          <div style={{ width: '40px', height: '12px', background: INK_TINT_06, borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
}

function HoleStatsEmpty({ isCompleted, roundLabel }: { isCompleted?: boolean; roundLabel?: string }) {
  if (isCompleted) {
    return (
      <EditorialEmpty
        icon={<BarChart3 size={28} strokeWidth={1.8} color="#64748b" />}
        tint="slate"
        eyebrow="Holes"
        title="Hole statistics not available"
        body="Detailed hole-by-hole statistics weren't captured for this tournament."
      />
    );
  }
  if (roundLabel) {
    return (
      <EditorialEmpty
        icon={<BarChart3 size={28} strokeWidth={1.8} color={AMBER} />}
        eyebrow={roundLabel}
        title={`${roundLabel} statistics will appear during play`}
        body="Hole-by-hole numbers populate as players post scores in this round."
      />
    );
  }
  return (
    <EditorialEmpty
      icon={<BarChart3 size={28} strokeWidth={1.8} color={AMBER} />}
      eyebrow="Holes"
      title="Hole-by-hole stats appear once play begins"
      body="Scoring distributions, hardest and easiest holes, and the field average will populate the moment the first round goes live."
    />
  );
}

export function HoleStatsTab({ tournamentId, isCompleted, courseId, courseName }: HoleStatsTabProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
  const [sort, setSort] = useState<'hole' | 'difficulty'>('hole');
  const { data: rawHoleStats, isLoading } = useTourHoleStats(tournamentId);

  const availableRounds = useMemo(() => {
    if (!rawHoleStats || rawHoleStats.length === 0) return ['Overall'];
    const rounds = [...new Set(rawHoleStats.map((h: any) => h.round_number))].sort();
    if (rounds.length <= 1) return ['Overall'];
    return ['Overall', ...rounds.map(r => `R${r}`)];
  }, [rawHoleStats]);

  const processedHoles = useMemo((): ProcessedHole[] => {
    if (!rawHoleStats || rawHoleStats.length === 0) return [];
    const roundNum = selectedRound === 'Overall' ? null : parseInt(selectedRound.replace('R', ''));
    const filtered = roundNum ? rawHoleStats.filter((h: any) => h.round_number === roundNum) : rawHoleStats;
    const holeMap = new Map<number, ProcessedHole>();

    for (const stat of filtered as any[]) {
      const scoreAvg = Number(stat.scoring_average) || 0;
      const diff = Number(stat.avg_diff) || 0;
      const existing = holeMap.get(stat.hole_number);
      if (existing) {
        existing.eagles += Number(stat.eagles) || 0;
        existing.birdies += Number(stat.birdies) || 0;
        existing.pars += Number(stat.pars) || 0;
        existing.bogeys += Number(stat.bogeys) || 0;
        existing.doubleBogeys += Number(stat.double_bogeys) || 0;
        existing.other += Number(stat.other) || 0;
        existing._scoreSum += scoreAvg;
        existing._scoreCount += 1;
        existing.scoringAverage = existing._scoreSum / existing._scoreCount;
        existing._diffSum += diff;
        existing._diffCount += 1;
        existing.avgDiff = existing._diffSum / existing._diffCount;
      } else {
        holeMap.set(stat.hole_number, {
          holeNumber: stat.hole_number, par: stat.par, yardage: stat.yardage,
          scoringAverage: scoreAvg, avgDiff: diff,
          eagles: Number(stat.eagles) || 0, birdies: Number(stat.birdies) || 0,
          pars: Number(stat.pars) || 0, bogeys: Number(stat.bogeys) || 0,
          doubleBogeys: Number(stat.double_bogeys) || 0, other: Number(stat.other) || 0,
          totalPlayers: stat.raw_data?.players || 0, difficultyRank: 0,
          _scoreSum: scoreAvg, _scoreCount: 1, _diffSum: diff, _diffCount: 1,
        });
      }
    }

    const holes = Array.from(holeMap.values()).sort((a, b) => a.holeNumber - b.holeNumber);
    const sorted = [...holes].sort((a, b) => b.avgDiff - a.avgDiff);
    sorted.forEach((hole, idx) => {
      const original = holes.find(h => h.holeNumber === hole.holeNumber);
      if (original) original.difficultyRank = idx + 1;
    });
    return holes;
  }, [rawHoleStats, selectedRound]);

  const toughestHoles = useMemo(() => [...processedHoles].sort((a, b) => b.avgDiff - a.avgDiff).slice(0, 3), [processedHoles]);
  const easiestHoles = useMemo(() => [...processedHoles].sort((a, b) => a.avgDiff - b.avgDiff).slice(0, 3), [processedHoles]);

  const roundScoringAvg = useMemo(() => {
    if (processedHoles.length === 0) return null;
    const totalPar = processedHoles.reduce((a, h) => a + h.par, 0);
    const totalAvg = processedHoles.reduce((a, h) => a + h.scoringAverage, 0);
    return totalAvg - totalPar;
  }, [processedHoles]);

  const frontNine = useMemo(() => processedHoles.filter(h => h.holeNumber <= 9), [processedHoles]);
  const backNine = useMemo(() => processedHoles.filter(h => h.holeNumber > 9), [processedHoles]);

  if (isLoading) return <HoleStatsSkeleton />;
  if (!rawHoleStats || rawHoleStats.length === 0) return <HoleStatsEmpty isCompleted={isCompleted} />;

  const hasRoundData = processedHoles.some(h => h.scoringAverage > 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {courseId && (
        <ConnectHandicapCue variant="tour-holes" courseName={courseName ?? ''} />
      )}
      {/* Round selector */}
      {availableRounds.length > 1 && (
        <div style={{ padding: '8px 20px' }}>
          <RoundSelector rounds={availableRounds} activeRound={selectedRound} onRoundChange={setSelectedRound} />
        </div>
      )}

      {!hasRoundData && selectedRound !== 'Overall' ? (
        <EditorialEmpty
          icon={<BarChart3 size={28} strokeWidth={1.8} color={AMBER} />}
          eyebrow={selectedRound}
          title={`${selectedRound} hasn't started yet`}
          body="Hole-by-hole stats will appear once play begins in this round."
        />
      ) : (
        <HoleStatsBody
          processedHoles={processedHoles}
          toughestHoles={toughestHoles}
          easiestHoles={easiestHoles}
          frontNine={frontNine}
          backNine={backNine}
          roundScoringAvg={roundScoringAvg}
          hasRoundData={hasRoundData}
          sort={sort}
          setSort={setSort}
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Per-hole presentation — ported from src/features/courses/components/holes/
// (HoleRow + HoleDistributionBar + HoleFeatureCards + HolesScoringKey) with
// tourhub typography/tokens and the tournament ProcessedHole data shape.
// ---------------------------------------------------------------------------

interface BodyProps {
  processedHoles: ProcessedHole[];
  toughestHoles: ProcessedHole[];
  easiestHoles: ProcessedHole[];
  frontNine: ProcessedHole[];
  backNine: ProcessedHole[];
  roundScoringAvg: number | null;
  hasRoundData: boolean;
  sort: 'hole' | 'difficulty';
  setSort: (s: 'hole' | 'difficulty') => void;
}

function HoleStatsBody({
  processedHoles, toughestHoles, easiestHoles, frontNine, backNine,
  roundScoringAvg, hasRoundData, sort, setSort,
}: BodyProps) {
  const hardest = toughestHoles[0];
  const easiest = easiestHoles[0];
  const showFeatureCards = hasRoundData && hardest && easiest && hardest.holeNumber !== easiest.holeNumber;

  const avgRange = useMemo(() => {
    if (processedHoles.length === 0) return { min: 0, max: 0.01 };
    const diffs = processedHoles.map(h => h.avgDiff);
    const min = Math.min(...diffs);
    // Anchor the top at >= 0 so genuinely over-par holes still read as hard,
    // and guarantee a non-zero span so we never divide by zero.
    const max = Math.max(0.01, ...diffs);
    return { min, max };
  }, [processedHoles]);

  const hardestNumber = hardest?.holeNumber;
  const easiestNumber = easiest?.holeNumber;

  return (
    <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: 8, fontFamily: FONT }}>
      {/* Hardest / Easiest feature cards */}
      {showFeatureCards && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 20px 6px' }}>
          <FeatureCard kind="hardest" hole={hardest!} />
          <FeatureCard kind="easiest" hole={easiest!} />
        </div>
      )}

      {/* Field-avg caption — preserves the FIELD AVG datum */}
      {hasRoundData && roundScoringAvg !== null && (
        <div style={{ padding: showFeatureCards ? '0 20px 14px' : '14px 20px', fontSize: 11.5, fontWeight: 600, color: INK_MUTE }}>
          Field average {roundScoringAvg > 0 ? '+' : ''}{roundScoringAvg.toFixed(1)} vs par
        </div>
      )}

      {/* ALL HOLES header + sort toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: AMBER, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          All Holes
        </span>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 999, padding: 2 }}>
          {([
            { v: 'hole', l: 'By hole' },
            { v: 'difficulty', l: 'By difficulty' },
          ] as const).map(opt => {
            const active = sort === opt.v;
            return (
              <button
                key={opt.v}
                onClick={() => setSort(opt.v)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  background: active ? INK : 'transparent',
                  color: active ? SURFACE : INK_MUTE,
                  transition: 'background 200ms ease, color 200ms ease',
                }}
              >
                {opt.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      {sort === 'hole' ? (
        <>
          {frontNine.length > 0 && <NineHeader label="Front Nine" />}
          {frontNine.map(h => (
            <HoleStatRow key={h.holeNumber} hole={h} avgRange={avgRange} hardestNumber={hardestNumber} easiestNumber={easiestNumber} />
          ))}
          {backNine.length > 0 && <NineHeader label="Back Nine" />}
          {backNine.map(h => (
            <HoleStatRow key={h.holeNumber} hole={h} avgRange={avgRange} hardestNumber={hardestNumber} easiestNumber={easiestNumber} />
          ))}
        </>
      ) : (
        [...processedHoles]
          .sort((a, b) => b.avgDiff - a.avgDiff)
          .map(h => (
            <HoleStatRow key={h.holeNumber} hole={h} avgRange={avgRange} hardestNumber={hardestNumber} easiestNumber={easiestNumber} />
          ))
      )}

      {/* Scoring key */}
      <div style={{ padding: '16px 20px 18px', borderTop: `0.5px solid ${INK_TINT_07}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: AMBER, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
          Scoring Key
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 16 }}>
          {[
            { c: C_BIRDIE, l: 'Birdie or better' },
            { c: C_PAR,    l: 'Par' },
            { c: C_BOGEY,  l: 'Bogey' },
            { c: C_DOUBLE, l: 'Double or worse' },
          ].map(item => (
            <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: item.c }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: INK_HOLE }}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NineHeader({ label }: { label: string }) {
  return (
    <div style={{ padding: '8px 20px', borderTop: `0.5px solid ${INK_TINT_07}`, background: INK_TINT_02 }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
        {label}
      </span>
    </div>
  );
}

function computeDist(hole: ProcessedHole) {
  const total = hole.eagles + hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.other;
  const pctOf = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return {
    birdie_better: pctOf(hole.eagles + hole.birdies),
    par:           pctOf(hole.pars),
    bogey:         pctOf(hole.bogeys),
    double_worse:  pctOf(hole.doubleBogeys + hole.other),
  };
}

function avgColor(pct: number) {
  if (pct > 0.75) return '#0F172A';  // hardest -> ink (dark)
  if (pct > 0.45) return '#475569';  // hard -> slate-600 (muted dark)
  return '#9F1D1D';                   // easiest -> red (good for the player)
}

function DistributionBar({ dist }: { dist: ReturnType<typeof computeDist> }) {
  const segs = [
    { v: dist.birdie_better, c: C_BIRDIE },
    { v: dist.par,           c: C_PAR },
    { v: dist.bogey,         c: C_BOGEY },
    { v: dist.double_worse,  c: C_DOUBLE },
  ];
  return (
    <div style={{ width: '100%', height: 6, borderRadius: 6, overflow: 'hidden', display: 'flex', background: '#eef1f5' }}>
      {segs.filter(s => s.v > 0).map((s, i) => (
        <div key={i} style={{ width: `${s.v}%`, background: s.c }} />
      ))}
    </div>
  );
}

function FeatureCard({ kind, hole }: { kind: 'hardest' | 'easiest'; hole: ProcessedHole }) {
  const isHardest = kind === 'hardest';
  const tint   = isHardest ? 'rgba(153,27,27,0.06)' : 'rgba(247,147,30,0.07)';
  const border = isHardest ? 'rgba(153,27,27,0.18)' : 'rgba(247,147,30,0.22)';
  const eyebrowColor = isHardest ? '#991B1B' : AMBER;
  const playsTo = (hole.par + hole.avgDiff).toFixed(1);
  return (
    <div style={{ flex: 1, background: tint, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: eyebrowColor, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {isHardest ? 'Hardest' : 'Easiest'}
      </div>
      <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-0.02em', color: INK_HOLE, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {hole.holeNumber}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: INK_MUTE, marginTop: 4, marginBottom: 10 }}>
        Plays to {playsTo}
      </div>
      <DistributionBar dist={computeDist(hole)} />
    </div>
  );
}

function HoleStatRow({
  hole, avgRange, hardestNumber, easiestNumber,
}: { hole: ProcessedHole; avgRange: { min: number; max: number }; hardestNumber?: number; easiestNumber?: number }) {
  const dist = computeDist(hole);
  const span = Math.max(0.01, avgRange.max - avgRange.min);
  const pct = Math.min(1, Math.max(0, (hole.avgDiff - avgRange.min) / span));
  const ramp = avgColor(pct);
  const avgLabel = hole.avgDiff > 0 ? `+${hole.avgDiff.toFixed(2)}` : hole.avgDiff.toFixed(2);
  const tag =
    hole.holeNumber === hardestNumber ? { l: 'Hardest', c: '#991B1B' as const } :
    hole.holeNumber === easiestNumber ? { l: 'Easiest', c: AMBER } :
    null;
  const rounds = hole.totalPlayers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, padding: '14px 20px', borderTop: `1px solid ${INK_TINT_06}` }}>
      {/* Top line: squircle + meta + big avg */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '34%', background: '#F1F5F9', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: INK_HOLE, fontVariantNumeric: 'tabular-nums' }}>{hole.holeNumber}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: INK_MUTE }}>
            Par {hole.par}
          </div>
          {tag && (
            <div style={{ fontSize: 9.5, fontWeight: 800, color: tag.c, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginTop: 3 }}>
              {tag.l}
            </div>
          )}
        </div>
        <span style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em', color: ramp, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {avgLabel}
        </span>
      </div>

      {/* Difficulty slider */}
      <div style={{ width: '100%', height: 3, background: '#eef1f5', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: ramp, transition: 'width 240ms cubic-bezier(.22,.61,.36,1)' }} />
      </div>

      {/* Distribution bar */}
      <DistributionBar dist={dist} />

      {/* Footer percentages + rounds */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: C_BIRDIE }}>{dist.birdie_better}%</span>
          <span style={{ color: C_PAR }}>{dist.par}%</span>
          <span style={{ color: C_BOGEY }}>{dist.bogey}%</span>
          <span style={{ color: C_DOUBLE }}>{dist.double_worse}%</span>
        </div>
        {rounds > 0 && (
          <span style={{ fontSize: 11, color: INK_MUTE, fontWeight: 600 }}>
            {rounds.toLocaleString()} round{rounds === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
