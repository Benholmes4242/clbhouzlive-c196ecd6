/**
 * HoleStatsTab - Flat dispatch hole-by-hole statistics
 */

import { useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { RoundSelector } from './RoundSelector';
import { EditorialEmpty } from './EditorialEmpty';
import { useTourHoleStats } from '../../hooks/useTourHubData';

interface HoleStatsTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  isCompleted?: boolean;
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
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      {/* Section rule skeleton */}
      <div className="animate-pulse" style={{ padding: '14px 20px 10px' }}>
        <div style={{ height: '9px', width: '180px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
      </div>
      {/* 3-col summary strip skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="animate-pulse" style={{ padding: '11px 0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px', borderRight: i < 2 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
            <div style={{ width: '50px', height: '8px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
            <div style={{ width: '60px', height: '15px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      {/* Column header skeleton */}
      <div style={{ height: '28px', background: 'rgba(15,23,42,0.02)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }} />
      {/* Hole rows */}
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: i < 8 ? '0.5px solid rgba(15,23,42,0.07)' : 'none', gap: '8px' }}>
          <div style={{ width: '28px', height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          <div style={{ width: '24px', height: '11px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          <div style={{ width: '40px', height: '10px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          <div style={{ flex: 1, height: '6px', background: 'rgba(15,23,42,0.06)', borderRadius: '3px' }} />
          <div style={{ width: '40px', height: '12px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
}

function HoleStatsEmpty({ isCompleted, roundLabel }: { isCompleted?: boolean; roundLabel?: string }) {
  if (isCompleted) {
    return (
      <EditorialEmpty
        eyebrow="Holes"
        title="Hole statistics not available"
        body="Detailed hole-by-hole statistics weren't captured for this tournament."
      />
    );
  }
  if (roundLabel) {
    return (
      <EditorialEmpty
        eyebrow={roundLabel}
        title={`${roundLabel} statistics will appear during play`}
        body="Hole-by-hole numbers populate as players post scores in this round."
      />
    );
  }
  return (
    <EditorialEmpty
      eyebrow="Holes"
      title="Hole-by-hole stats appear once play begins"
      body="Scoring distributions, hardest and easiest holes, and the field average will populate the moment the first round goes live."
    />
  );
}

export function HoleStatsTab({ tournamentId, isCompleted }: HoleStatsTabProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
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
      {/* Round selector */}
      {availableRounds.length > 1 && (
        <div style={{ padding: '8px 20px' }}>
          <RoundSelector rounds={availableRounds} activeRound={selectedRound} onRoundChange={setSelectedRound} />
        </div>
      )}

      {!hasRoundData && selectedRound !== 'Overall' ? (
        <motion.div className="flex items-center justify-center min-h-[300px] py-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="text-center space-y-3">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{selectedRound} hasn't started yet</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">Hole-by-hole stats will appear once play begins.</p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* 3-col summary strip */}
          {hasRoundData && toughestHoles.length > 0 && easiestHoles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
              <div style={{ padding: '11px 0', textAlign: 'center' as const, borderRight: '0.5px solid rgba(15,23,42,0.07)' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', marginBottom: '3px' }}>HARDEST</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Hole {toughestHoles[0]?.holeNumber}</div>
                <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>+{toughestHoles[0]?.avgDiff.toFixed(2)}</div>
              </div>
              <div style={{ padding: '11px 0', textAlign: 'center' as const, borderRight: '0.5px solid rgba(15,23,42,0.07)' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', marginBottom: '3px' }}>EASIEST</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Hole {easiestHoles[0]?.holeNumber}</div>
                <div style={{ fontSize: '12px', color: '#F7931E', fontWeight: 700 }}>{easiestHoles[0]?.avgDiff.toFixed(2)}</div>
              </div>
              <div style={{ padding: '11px 0', textAlign: 'center' as const }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', marginBottom: '3px' }}>FIELD AVG</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>{roundScoringAvg !== null ? (roundScoringAvg > 0 ? `+${roundScoringAvg.toFixed(1)}` : roundScoringAvg.toFixed(1)) : '—'}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>vs par</div>
              </div>
            </div>
          )}

          {/* Section header */}
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                Hole by Hole
              </span>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderBottom: '0.5px solid rgba(15,23,42,0.07)', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <span style={{ width: '28px', fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>H</span>
            <span style={{ width: '28px', fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>PAR</span>
            {/* YDS column dropped Phase 1 — sr_hole_statistics.yardage is 100% NULL.
                See audit B10. Re-introduce when ingestion populates this field. */}
            <span style={{ flex: 1, fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>SCORING DIST.</span>
            <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>AVG</span>
          </div>

          {/* Hole rows */}
          <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
            {/* Front Nine header */}
            {frontNine.length > 0 && (
              <div style={{ padding: '8px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(15,23,42,0.02)' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Front Nine</span>
              </div>
            )}
            {frontNine.map((hole) => {
              const total = hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.eagles;
              const bPct = total > 0 ? (hole.birdies / total) * 100 : 0;
              const pPct = total > 0 ? (hole.pars / total) * 100 : 0;
              const boPct = total > 0 ? (hole.bogeys / total) * 100 : 0;
              const isHard = hole.avgDiff > 0.3;
              const isEasy = hole.avgDiff < -0.2;
              return (
                <div key={hole.holeNumber} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
                  <span style={{ width: '28px', fontSize: '14px', fontWeight: 900, color: isHard ? '#DC2626' : isEasy ? '#F7931E' : '#94A3B8', flexShrink: 0 }}>{hole.holeNumber}</span>
                  <span style={{ width: '28px', fontSize: '12px', color: '#64748B', flexShrink: 0 }}>{hole.par}</span>
                  {/* yardage column dropped — see header comment */}
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${bPct}%`, background: '#F7931E' }} />
                    <div style={{ width: `${pPct}%`, background: 'rgba(15,23,42,0.08)' }} />
                    <div style={{ width: `${boPct}%`, background: 'rgba(220,38,38,0.35)' }} />
                  </div>
                  <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '13px', fontWeight: 800, color: hole.avgDiff > 0 ? '#DC2626' : '#F7931E', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {hole.avgDiff > 0 ? `+${hole.avgDiff.toFixed(2)}` : hole.avgDiff.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {/* Back Nine header */}
            {backNine.length > 0 && (
              <div style={{ padding: '8px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', background: 'rgba(15,23,42,0.02)' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Back Nine</span>
              </div>
            )}
            {backNine.map((hole) => {
              const total = hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.eagles;
              const bPct = total > 0 ? (hole.birdies / total) * 100 : 0;
              const pPct = total > 0 ? (hole.pars / total) * 100 : 0;
              const boPct = total > 0 ? (hole.bogeys / total) * 100 : 0;
              const isHard = hole.avgDiff > 0.3;
              const isEasy = hole.avgDiff < -0.2;
              return (
                <div key={hole.holeNumber} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
                  <span style={{ width: '28px', fontSize: '14px', fontWeight: 900, color: isHard ? '#DC2626' : isEasy ? '#F7931E' : '#94A3B8', flexShrink: 0 }}>{hole.holeNumber}</span>
                  <span style={{ width: '28px', fontSize: '12px', color: '#64748B', flexShrink: 0 }}>{hole.par}</span>
                  {/* yardage column dropped — see header comment */}
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${bPct}%`, background: '#F7931E' }} />
                    <div style={{ width: `${pPct}%`, background: 'rgba(15,23,42,0.08)' }} />
                    <div style={{ width: `${boPct}%`, background: 'rgba(220,38,38,0.35)' }} />
                  </div>
                  <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '13px', fontWeight: 800, color: hole.avgDiff > 0 ? '#DC2626' : '#F7931E', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {hole.avgDiff > 0 ? `+${hole.avgDiff.toFixed(2)}` : hole.avgDiff.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Distribution legend */}
          <div style={{ display: 'flex', gap: '16px', padding: '10px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            {[{ c: '#F7931E', l: 'Birdie' }, { c: 'rgba(15,23,42,0.1)', l: 'Par' }, { c: 'rgba(220,38,38,0.35)', l: 'Bogey+' }].map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '6px', borderRadius: '2px', background: x.c }} />
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{x.l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
