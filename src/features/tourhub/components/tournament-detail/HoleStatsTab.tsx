/**
 * HoleStatsTab — Flat hole-by-hole, round-aware.
 *
 * Layout (matches signed-off mock):
 *  - Eyebrow "HOLE STATS · {round}" + RoundSelector (Overall + R1–R4)
 *  - Hardest / Easiest summary cards (SLATE_50 bg)
 *  - By Hole / By Difficulty toggle
 *  - De-boxed column header (Hole / Par / Scoring / Avg)
 *  - Per-hole rows: counts centered above stacked distribution bar
 *  - Legend at bottom
 */

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourHoleStats } from '../../hooks/useTourHubData';
import {
  AMBER, AMBER_SOFT_BG, GOLD_DEEP, FONT, INK, INK_FAINT, INK_MUTE,
  INK_TINT_06, INK_TINT_07, SLATE_50, SURFACE,
} from '../../_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';

// Birdie+ red, par slate, bogey+ blue (mock spec — eagles folded into birdie+,
// doubles folded into bogey+).
const C_BIRDIE = '#9F1D1D';
const C_PAR    = '#94A3B8';
const C_BOGEY  = '#2563EB';

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
    <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
      <div className="animate-pulse" style={{ padding: '14px 16px 10px' }}>
        <div style={{ height: 9, width: 180, background: INK_TINT_06, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 14px' }}>
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse" style={{ flex: 1, height: 70, background: SLATE_50, borderRadius: 10 }} />
        ))}
      </div>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderTop: `0.5px solid ${INK_TINT_07}`, gap: 8 }}>
          <div style={{ width: 28, height: 13, background: INK_TINT_06, borderRadius: 4 }} />
          <div style={{ width: 24, height: 11, background: INK_TINT_06, borderRadius: 4 }} />
          <div style={{ flex: 1, height: 6, background: INK_TINT_06, borderRadius: 3 }} />
          <div style={{ width: 40, height: 12, background: INK_TINT_06, borderRadius: 4 }} />
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

  const toughestHoles = useMemo(() => [...processedHoles].sort((a, b) => b.avgDiff - a.avgDiff), [processedHoles]);
  const easiestHoles = useMemo(() => [...processedHoles].sort((a, b) => a.avgDiff - b.avgDiff), [processedHoles]);

  if (isLoading) return <HoleStatsSkeleton />;
  if (!rawHoleStats || rawHoleStats.length === 0) return <HoleStatsEmpty isCompleted={isCompleted} />;

  const hasRoundData = processedHoles.some(h => h.scoringAverage > 0);
  const hardest = toughestHoles[0];
  const easiest = easiestHoles[0];

  const rows = sort === 'difficulty'
    ? [...processedHoles].sort((a, b) => b.avgDiff - a.avgDiff)
    : processedHoles;

  const roundLabel = selectedRound === 'Overall' ? 'Overall' : `Round ${selectedRound.replace('R', '')}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ fontFamily: FONT }}>
      {courseId && (
        <ConnectHandicapCue variant="tour-holes" courseName={courseName ?? ''} />
      )}

      {/* Section eyebrow */}
      <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, padding: '14px 16px 10px' }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: INK_MUTE,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Hole Stats · {roundLabel}
        </span>
      </div>

      {/* Round selector */}
      {availableRounds.length > 1 && (
        <div style={{ background: SURFACE, padding: '0 16px 12px' }}>
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
        <div style={{ background: SURFACE }}>
          {/* Hardest / Easiest summary */}
          {hardest && easiest && (
            <div style={{ display: 'flex', gap: 10, padding: '0 16px 14px' }}>
              <SummaryCard label="Hardest" hole={hardest} accent={GOLD_DEEP} />
              <SummaryCard label="Easiest" hole={easiest} accent={C_BIRDIE} />
            </div>
          )}

          {/* Sort toggle */}
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
            {([['hole', 'By Hole'], ['difficulty', 'By Difficulty']] as const).map(([v, label]) => {
              const active = sort === v;
              return (
                <button
                  key={v}
                  onClick={() => setSort(v)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontWeight: 800,
                    background: active ? INK : SURFACE,
                    color: active ? SURFACE : INK_MUTE,
                    border: `1px solid ${active ? INK : INK_TINT_07}`,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* De-boxed column header */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '8px 16px',
            borderTop: `0.5px solid ${INK_TINT_07}`,
            borderBottom: `0.5px solid ${INK_TINT_07}`,
          }}>
            <span style={{ width: 38, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Hole</span>
            <span style={{ width: 32, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>Par</span>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>Scoring</span>
            <span style={{ width: 46, fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right', flexShrink: 0 }}>Avg</span>
          </div>

          {/* Rows */}
          {rows.map(h => (
            <HoleRow key={h.holeNumber} hole={h} />
          ))}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, padding: '14px 16px 20px', justifyContent: 'center', borderTop: `0.5px solid ${INK_TINT_07}` }}>
            {([['Birdie+', C_BIRDIE], ['Par', C_PAR], ['Bogey+', C_BOGEY]] as const).map(([l, c]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: INK_MUTE }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SummaryCard({ label, hole, accent }: { label: string; hole: ProcessedHole; accent: string }) {
  const avgLabel = (hole.par + hole.avgDiff).toFixed(2);
  return (
    <div style={{ flex: 1, background: SLATE_50, borderRadius: 10, padding: '10px 12px' }}>
      <span style={{
        fontSize: 9, fontWeight: 800, color: INK_FAINT,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>Hole {hole.holeNumber}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK_MUTE }}>Par {hole.par}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
        {avgLabel} avg
      </div>
    </div>
  );
}

function HoleRow({ hole }: { hole: ProcessedHole }) {
  const birdiePlus = hole.eagles + hole.birdies;
  const bogeyPlus = hole.bogeys + hole.doubleBogeys + hole.other;
  const total = birdiePlus + hole.pars + bogeyPlus;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  const hard = hole.difficultyRank > 0 && hole.difficultyRank <= 5;
  const avgLabel = hole.avgDiff > 0 ? `+${hole.avgDiff.toFixed(2)}` : hole.avgDiff.toFixed(2);

  return (
    <div style={{
      padding: '11px 16px',
      borderBottom: `0.5px solid ${INK_TINT_07}`,
      background: hard ? AMBER_SOFT_BG : 'transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 38, fontSize: 14, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {hole.holeNumber}
        </span>
        <span style={{ width: 32, fontSize: 13, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {hole.par}
        </span>

        <div style={{ flex: 1, paddingRight: 12 }}>
          {total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C_BIRDIE }}>
                {birdiePlus} birdie{birdiePlus === 1 ? '' : 's'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE }}>
                {hole.pars} par
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C_BOGEY }}>
                {bogeyPlus} bogey{bogeyPlus === 1 ? '' : 's'}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#EEF2F6' }}>
            {pct(birdiePlus) > 0 && <div style={{ width: `${pct(birdiePlus)}%`, background: C_BIRDIE }} />}
            {pct(hole.pars) > 0 && <div style={{ width: `${pct(hole.pars)}%`, background: C_PAR }} />}
            {pct(bogeyPlus) > 0 && <div style={{ width: `${pct(bogeyPlus)}%`, background: C_BOGEY }} />}
          </div>
        </div>

        <span style={{
          width: 46, textAlign: 'right', fontSize: 14, fontWeight: 800,
          color: hard ? GOLD_DEEP : INK, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>
          {avgLabel}
        </span>
      </div>
    </div>
  );
}
