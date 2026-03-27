/**
 * PlayerScorecardCard — Scorecard content rendered inside the expanded glass card.
 * No own background — the parent HeroSlide glass card provides blur/overlay.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Trophy } from 'lucide-react';
import { usePlayerScorecard, type RoundScorecard, type HoleScore } from '@/hooks/usePlayerScorecard';
import { getScoreTextClass, getScoreBgClass, SCORE_COLORS } from '@/features/tourhub/utils/scoreColors';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlayerInfo {
  id: string;
  srId: string;
  name: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  countryCode?: string;
  countryFlag?: string;
  position: string | number;
  totalScore: number;
  thru: string;
  currentRound?: number;
}

interface PlayerScorecardCardProps {
  player: PlayerInfo;
  tournamentId: string;
  tournamentName: string;
  courseName: string;
  onBack: () => void;
  onClose: () => void;
}

// Score color helpers now imported from @/features/tourhub/utils/scoreColors

function formatScoreToPar(score: number): string {
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

// ── Hole Cell Component ────────────────────────────────────────────────────────

function HoleCell({ hole }: { hole: HoleScore }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
        {hole.holeNumber}
      </span>
      <span className="text-[10px] text-white/30">{hole.par}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getScoreBgClass(hole.scoreToPar)}`}>
        <span className={`text-sm font-bold ${getScoreTextClass(hole.scoreToPar)}`}>{hole.strokes}</span>
      </div>
    </div>
  );
}

function EmptyHoleCell({ holeNumber, par }: { holeNumber: number; par: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{holeNumber}</span>
      <span className="text-[10px] text-white/30">{par}</span>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03]">
        <span className="text-sm text-white/20">—</span>
      </div>
    </div>
  );
}

// ── Nine-Hole Row ──────────────────────────────────────────────────────────────

function NineHoleRow({
  label,
  startHole,
  completedHoles,
  defaultPars,
}: {
  label: string;
  holes: HoleScore[];
  startHole: number;
  completedHoles: Map<number, HoleScore>;
  defaultPars: Record<number, number>;
}) {
  const nineHoles = Array.from({ length: 9 }, (_, i) => completedHoles.get(startHole + i));
  const outScore = nineHoles.reduce((sum, h) => sum + (h?.strokes || 0), 0);
  const outPar = nineHoles.reduce((sum, h, i) => sum + (h?.par || defaultPars[startHole + i] || 4), 0);
  const hasAnyScore = nineHoles.some((h) => h !== undefined);

  return (
    <div className="px-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[1.5px]">{label}</span>
        {hasAnyScore && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30">Par {outPar}</span>
            <span className="text-xs font-bold text-white/80">{outScore || '—'}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }, (_, i) => {
          const holeNum = startHole + i;
          const hole = completedHoles.get(holeNum);
          if (hole) return <HoleCell key={holeNum} hole={hole} />;
          return <EmptyHoleCell key={holeNum} holeNumber={holeNum} par={defaultPars[holeNum] || 4} />;
        })}
      </div>
    </div>
  );
}

// ── Round Tab Selector ─────────────────────────────────────────────────────────

function RoundTabs({
  rounds,
  activeRound,
  currentRound,
  onSelect,
}: {
  rounds: RoundScorecard[];
  activeRound: number;
  currentRound: number;
  onSelect: (round: number) => void;
}) {
  const maxRound = Math.max(currentRound, ...rounds.map((r) => r.roundNumber));
  const tabs = Array.from({ length: maxRound }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {tabs.map((roundNum) => {
        const hasData = rounds.some((r) => r.roundNumber === roundNum);
        const isActive = roundNum === activeRound;
        const isCurrent = roundNum === currentRound;

        return (
          <button
            key={roundNum}
            onClick={() => hasData && onSelect(roundNum)}
            disabled={!hasData}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
              ${isActive ? 'bg-white text-black' : hasData ? 'bg-white/10 text-white/70 hover:bg-white/15' : 'bg-white/[0.03] text-white/20 cursor-not-allowed'}
              ${isCurrent && !isActive ? 'ring-1 ring-white/20' : ''}
            `}
          >
            R{roundNum}
          </button>
        );
      })}
    </div>
  );
}

// ── Scorecard Skeleton ─────────────────────────────────────────────────────────

function ScorecardSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Hero skeleton — horizontal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 10px' }}>
        <div style={{ width: 52, height: 55, borderRadius: '34%', background: 'rgba(255,255,255,0.08)', flexShrink: 0, animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: '65%', borderRadius: 5, background: 'rgba(255,255,255,0.08)', marginBottom: 7, animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)' }} />
          <div style={{ height: 9, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div style={{ width: 44, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
      </div>

      {/* Round chips skeleton */}
      <div style={{ display: 'flex', gap: 5, padding: '0 16px 8px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 46, borderRadius: 8, background: i === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
        ))}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 6px' }} />

      {/* Round tabs skeleton */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '4px 0 8px' }}>
        {[1,2].map(i => (
          <div key={i} style={{ width: 40, height: 26, borderRadius: 20, background: i === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }} />
        ))}
      </div>

      {/* Stat chips skeleton */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 10px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 38, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
        ))}
      </div>

      {/* Front 9 skeleton */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ height: 9, width: 60, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 2 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 14, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Back 9 skeleton */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ height: 9, width: 55, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 2 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 14, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.05)', animation: 'clb-shimmer 1.8s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Total row skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4 }}>
        <div style={{ width: 40, height: 8, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 50, height: 9, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ width: 30, height: 13, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: 24, height: 11, borderRadius: 4, background: 'rgba(74,222,128,0.15)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PlayerScorecardCard({
  player,
  tournamentId,
  tournamentName,
  onBack,
  onClose,
}: PlayerScorecardCardProps) {
  const navigate = useNavigate();
  const { data: scorecard, isLoading } = usePlayerScorecard(tournamentId, player.id);
  const [activeRound, setActiveRound] = useState<number>(
    player.currentRound || scorecard?.currentRound || 1
  );

  const activeRoundData = useMemo(
    () => scorecard?.rounds.find((r) => r.roundNumber === activeRound),
    [scorecard, activeRound],
  );

  const completedHoles = useMemo(() => {
    const map = new Map<number, HoleScore>();
    if (activeRoundData) {
      for (const hole of activeRoundData.holes) map.set(hole.holeNumber, hole);
    }
    return map;
  }, [activeRoundData]);

  const defaultPars = useMemo(() => {
    const pars: Record<number, number> = {};
    if (activeRoundData) {
      for (const hole of activeRoundData.holes) pars[hole.holeNumber] = hole.par;
    }
    for (let i = 1; i <= 18; i++) { if (!pars[i]) pars[i] = 4; }
    return pars;
  }, [activeRoundData]);

  const roundScores = useMemo(() => {
    if (!scorecard) return [];
    return scorecard.rounds.map((r) => ({
      round: r.roundNumber,
      strokes: r.totalStrokes,
      toPar: r.totalToPar,
      holesCompleted: r.holesCompleted,
    }));
  }, [scorecard]);

  const currentRound = scorecard?.currentRound || player.currentRound || 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="flex flex-col h-full"
      style={{ overflow: 'hidden' }}
    >

      {/* ── TOP BAR — back + condensed live badge ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.55)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
            Leaderboard
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
            boxShadow: '0 0 5px 2px rgba(34,197,94,0.4)',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', color: '#22C55E' }}>
            LIVE
          </span>
          <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginLeft: 2 }}>
            {tournamentName && tournamentName.length < 20 ? tournamentName : 'PGA TOUR'}
            {player.currentRound ? ` · R${player.currentRound}` : ''}
          </span>
        </div>
      </div>

      {/* ── PLAYER HERO — horizontal layout ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px 10px',
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <button
          onClick={() => navigate(`/tourhub/player/${player.id}`)}
          style={{ flexShrink: 0, position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          className="active:scale-95 transition-transform"
        >
          <div style={{
            width: 52, height: 55, borderRadius: '34%',
            border: '2px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                {player.firstName?.[0]}{player.lastName?.[0]}
              </span>
            )}
          </div>
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            background: 'white', borderRadius: '50%',
            width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800, color: 'black',
          }}>
            {player.position}
          </div>
        </button>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 16, fontWeight: 800, color: '#fff',
            display: 'block', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {player.name}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>
            {player.thru === 'F' ? 'Finished' : player.thru ? `Thru ${player.thru}` : 'Round 1'}
            {player.currentRound ? ` · Round ${player.currentRound}` : ''}
          </span>
        </div>

        {/* Total score */}
        <span style={{
          fontSize: 28, fontWeight: 900,
          color: player.totalScore < 0 ? '#4ade80' : player.totalScore === 0 ? 'rgba(255,255,255,0.75)' : '#f87171',
          fontFamily: "'JetBrains Mono','SF Mono',monospace",
          letterSpacing: -1, flexShrink: 0,
        }}>
          {formatScoreToPar(player.totalScore)}
        </span>
      </div>

      {/* ── ROUND SCORE CHIPS — all 4 rounds ── */}
      {roundScores.length > 0 && (
        <div style={{
          display: 'flex', gap: 5,
          padding: '0 16px 8px',
          flexShrink: 0,
        }}>
          {Array.from({ length: Math.max(currentRound, 4) }, (_, i) => {
            const roundNum = i + 1;
            const rs = roundScores.find(r => r.round === roundNum);
            const isActive = roundNum === activeRound;
            const hasData = rs && rs.holesCompleted > 0;
            return (
              <button
                key={roundNum}
                onClick={() => hasData && setActiveRound(roundNum)}
                disabled={!hasData}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '5px 4px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.07)'}`,
                  cursor: hasData ? 'pointer' : 'default',
                }}
              >
                <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  R{roundNum}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: hasData ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                  {hasData ? rs.strokes : '—'}
                </span>
                {hasData && (
                  <span style={{
                    fontSize: 9, fontWeight: 600,
                    color: rs.toPar < 0 ? '#4ade80' : rs.toPar === 0 ? 'rgba(255,255,255,0.5)' : '#f87171',
                  }}>
                    {formatScoreToPar(rs.toPar)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Separator */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 6px', flexShrink: 0 }} />

      {/* ── SCORECARD CONTENT — scrollable ── */}
      {isLoading ? (
        <ScorecardSkeleton />
      ) : scorecard && scorecard.rounds.length > 0 ? (
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>

          {/* Round tabs */}
          <RoundTabs
            rounds={scorecard.rounds}
            activeRound={activeRound}
            currentRound={currentRound}
            onSelect={setActiveRound}
          />

          {/* Stat chips — same language as leader strip */}
          {activeRoundData && activeRoundData.holesCompleted > 0 && (
            <div style={{ display: 'flex', gap: 4, padding: '0 16px 8px' }}>
              {[
                { v: activeRoundData.eagles,       label: 'Eagles',  color: '#F59E0B' },
                { v: activeRoundData.birdies,      label: 'Birdies', color: '#4ade80' },
                { v: activeRoundData.pars,         label: 'Pars',    color: 'rgba(255,255,255,0.65)' },
                { v: activeRoundData.bogeys,       label: 'Bogeys',  color: '#F97316' },
                { v: activeRoundData.doubleBogeys, label: 'Doubles', color: '#f87171' },
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, textAlign: 'center',
                  padding: '5px 2px 4px',
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.v}</div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Front 9 */}
          <div style={{ marginTop: 4 }}>
            <NineHoleRow
              label="Front 9"
              holes={activeRoundData?.holes.filter(h => h.holeNumber <= 9) || []}
              startHole={1}
              completedHoles={completedHoles}
              defaultPars={defaultPars}
            />
          </div>

          {/* Back 9 */}
          <div style={{ marginTop: 8 }}>
            <NineHoleRow
              label="Back 9"
              holes={activeRoundData?.holes.filter(h => h.holeNumber > 9) || []}
              startHole={10}
              completedHoles={completedHoles}
              defaultPars={defaultPars}
            />
          </div>

          {/* Total row */}
          {activeRoundData && activeRoundData.holesCompleted > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px 4px',
              marginTop: 6,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>
                  {activeRoundData.holesCompleted} holes
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  {activeRoundData.totalStrokes}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: activeRoundData.totalToPar < 0 ? '#4ade80'
                    : activeRoundData.totalToPar > 0 ? '#f87171'
                    : 'rgba(255,255,255,0.6)',
                }}>
                  {formatScoreToPar(activeRoundData.totalToPar)}
                </span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '6px 16px 10px',
          }}>
            {[
              { label: 'Eagle',   color: SCORE_COLORS.eagle.tailwindBg },
              { label: 'Birdie',  color: SCORE_COLORS.birdie.tailwindBg },
              { label: 'Par',     color: SCORE_COLORS.par.tailwindBg },
              { label: 'Bogey',   color: SCORE_COLORS.bogey.tailwindBg },
              { label: 'Double+', color: SCORE_COLORS.doublePlus.tailwindBg },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div className={`w-2.5 h-2.5 rounded ${color}`} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Trophy className="w-6 h-6 text-white/40" />
          </div>
          <p className="text-sm text-white/40 text-center">Scorecard data updating...</p>
          <p className="text-xs text-white/25 text-center mt-1">Hole-by-hole scores will appear as the round progresses</p>
        </div>
      )}
    </motion.div>
  );
}
