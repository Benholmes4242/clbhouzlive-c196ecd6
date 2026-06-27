/**
 * HoleStatsTab — Tournament Holes tab, rebuilt on the course-details Holes
 * component family (HoleRow + HolesScoringKey). The only tournament-specific
 * surface is the round selector (Overall / R1 / R2 …) above the list.
 *
 * Data flow: useTourHoleStats → ProcessedHole → toHoleRowData → CourseHole shape
 * consumed by the shared HoleRow card. Tournaments lack stroke index, so SI is
 * passed as null (HoleRow conditionally omits it). Aces/albatrosses aren't
 * tracked separately at tournament granularity, so those buckets are 0 and
 * "other" is folded into double+.
 */

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourHoleStats } from '../../hooks/useTourHubData';
import { HoleRow } from '@/features/courses/components/holes/HoleRow';

import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import {
  AMBER, FONT, INK, INK_MUTE, INK_TINT_06, INK_TINT_07, SLATE_50, SURFACE,
} from '../../_shared/tokens';
import { HAIRLINE_INK_8 } from '@/features/courses/_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';

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

function toHoleRowData(p: ProcessedHole): CourseHole {
  const totalStrokes =
    p.eagles + p.birdies + p.pars + p.bogeys + p.doubleBogeys + p.other;
  const total = totalStrokes || p.totalPlayers || 1;
  const pct = (n: number) => (n / total) * 100;
  return {
    hole_no: p.holeNumber,
    par: p.par,
    yards: p.yardage,
    stroke_index: null,
    rounds: p.totalPlayers || totalStrokes,
    avg_to_par: p.avgDiff,
    avg_gross: p.scoringAverage,
    dist: {
      ace: 0,
      albatross: 0,
      eagle: pct(p.eagles),
      birdie: pct(p.birdies),
      par: pct(p.pars),
      bogey: pct(p.bogeys),
      double: pct(p.doubleBogeys + p.other),
    },
  };
}

function HoleStatsSkeleton() {
  return (
    <div style={{ background: SLATE_50, borderTop: `0.5px solid ${INK_TINT_07}` }}>
      <div className="animate-pulse" style={{ padding: '14px 16px 10px' }}>
        <div style={{ height: 9, width: 180, background: INK_TINT_06, borderRadius: 4 }} />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            margin: '10px 14px 0',
            height: 220,
            background: SURFACE,
            border: `1px solid ${HAIRLINE_INK_8}`,
            borderRadius: 14,
          }}
        />
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

  if (isLoading) return <HoleStatsSkeleton />;
  if (!rawHoleStats || rawHoleStats.length === 0) return <HoleStatsEmpty isCompleted={isCompleted} />;

  const hasRoundData = processedHoles.some(h => h.scoringAverage > 0 || h.avgDiff !== 0);

  const hardest = processedHoles.reduce<ProcessedHole | null>(
    (m, h) => (!m || h.avgDiff > m.avgDiff ? h : m),
    null,
  );
  const easiest = processedHoles.reduce<ProcessedHole | null>(
    (m, h) => (!m || h.avgDiff < m.avgDiff ? h : m),
    null,
  );
  const maxAvg = Math.max(0.01, ...processedHoles.map(h => h.avgDiff));

  const rows = sort === 'difficulty'
    ? [...processedHoles].sort((a, b) => b.avgDiff - a.avgDiff)
    : processedHoles;

  const roundLabel = selectedRound === 'Overall' ? 'Overall' : `Round ${selectedRound.replace('R', '')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ fontFamily: FONT, background: SLATE_50 }}
    >
      {courseId && (
        <ConnectHandicapCue variant="tour-holes" courseName={courseName ?? ''} />
      )}

      {/* Section eyebrow */}
      <div style={{ background: SLATE_50, borderTop: `0.5px solid ${INK_TINT_07}`, padding: '14px 16px 10px' }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: INK_MUTE,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Hole Stats · {roundLabel}
        </span>
      </div>

      {/* Round selector */}
      {availableRounds.length > 1 && (
        <div style={{ background: SLATE_50, padding: '0 16px 12px' }}>
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
        <div style={{ background: SLATE_50 }}>
          {/* Sort toggle — mirrors the course Holes tab */}
          <div
            style={{
              padding: '4px 18px 8px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                gap: 2,
                background: '#F1F5F9',
                border: `1px solid ${HAIRLINE_INK_8}`,
                borderRadius: 999,
                padding: 3,
              }}
            >
              {([['hole', 'By hole'], ['difficulty', 'By difficulty']] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: sort === k ? INK : 'transparent',
                    color: sort === k ? SURFACE : INK_MUTE,
                    fontFamily: FONT,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {rows.map(h => (
            <HoleRow
              key={h.holeNumber}
              h={toHoleRowData(h)}
              maxAvg={maxAvg}
              isHardest={hardest != null && h.holeNumber === hardest.holeNumber}
              isEasiest={easiest != null && h.holeNumber === easiest.holeNumber}
            />
          ))}

          
        </div>
      )}
    </motion.div>
  );
}
