/**
 * PlayerScorecardCard — Scorecard content rendered inside the expanded glass card.
 * No own background — the parent HeroSlide glass card provides blur/overlay.
 */
import { useState, useMemo } from 'react';
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

// ── Round Summary Bar ──────────────────────────────────────────────────────────

function RoundSummary({ round }: { round: RoundScorecard }) {
  const stats = [
    { label: 'Eagles', value: round.eagles, color: SCORE_COLORS.eagle.tailwindText },
    { label: 'Birdies', value: round.birdies, color: SCORE_COLORS.birdie.tailwindText },
    { label: 'Pars', value: round.pars, color: SCORE_COLORS.par.tailwindText },
    { label: 'Bogeys', value: round.bogeys, color: SCORE_COLORS.bogey.tailwindText },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-0.5">
          <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[1.5px]">{stat.label}</span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-0.5 ml-2 pl-4 border-l border-white/10">
        <span className="text-lg font-bold text-white">{round.totalStrokes}</span>
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[1.5px]">{formatScoreToPar(round.totalToPar)}</span>
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
    <div className="space-y-4 px-4 py-6 animate-pulse">
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="w-10 h-7 rounded-full bg-white/10" />)}
      </div>
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-4 h-3 rounded bg-white/10" />
            <div className="w-8 h-8 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-4 h-3 rounded bg-white/10" />
            <div className="w-8 h-8 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PlayerScorecardCard({
  player,
  tournamentId,
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
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* ── Top bar: Back + Close ─────────────────────────────────────── */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Leaderboard</span>
        </button>
      </div>

      {/* ── Player Hero Section ───────────────────────────────────────── */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4">
        <button
          onClick={() => navigate(`/tourhub/player/${player.id}`)}
          className="relative mb-3 active:scale-95 transition-transform"
        >
          {player.photoUrl ? (
            <div
              className="overflow-hidden flex-shrink-0"
              style={{ width: 80, height: 84, borderRadius: '34%', border: '1.5px solid #F8FAFC', background: '#F8FAFC' }}
            >
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 80, height: 84, borderRadius: '34%', border: '1.5px solid #F8FAFC', background: '#F8FAFC' }}
            >
              <span className="text-2xl font-bold" style={{ color: '#64748B' }}>
                {player.firstName?.[0]}{player.lastName?.[0]}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-0.5 shadow-lg">
            <span className="text-xs font-bold text-black">{player.position}</span>
          </div>
        </button>

        <h2 className="text-xl font-bold text-white text-center">{player.name}</h2>
        {player.countryFlag && <span className="text-base mt-0.5">{player.countryFlag}</span>}

        <div className="flex items-center gap-3 mt-2">
          <span className="text-3xl font-bold text-white">{formatScoreToPar(player.totalScore)}</span>
          {player.thru && player.thru !== 'F' && (
            <span className="text-sm text-white/50 font-medium">thru {player.thru}</span>
          )}
        </div>

        {roundScores.length > 0 && (
          <div className="flex items-center gap-3 mt-3">
            {roundScores.map((rs) => (
              <div
                key={rs.round}
                className={`flex flex-col items-center px-2.5 py-1 rounded-lg ${rs.round === activeRound ? 'bg-white/10' : 'bg-transparent'}`}
              >
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">R{rs.round}</span>
                <span className="text-sm font-bold text-white">{rs.holesCompleted > 0 ? rs.strokes : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="mx-4 h-px bg-white/10" />

      {/* ── Scorecard Section ─────────────────────────────────────────── */}
      {isLoading ? (
        <ScorecardSkeleton />
      ) : scorecard && scorecard.rounds.length > 0 ? (
        <div className="flex-1 pb-6">
          <RoundTabs
            rounds={scorecard.rounds}
            activeRound={activeRound}
            currentRound={currentRound}
            onSelect={setActiveRound}
          />
          {activeRoundData && activeRoundData.holesCompleted > 0 && (
            <RoundSummary round={activeRoundData} />
          )}
          <div className="mx-4 h-px bg-white/10 my-2" />
          <div className="mt-3">
            <NineHoleRow
              label="Front 9"
              holes={activeRoundData?.holes.filter((h) => h.holeNumber <= 9) || []}
              startHole={1}
              completedHoles={completedHoles}
              defaultPars={defaultPars}
            />
          </div>
          <div className="mt-4">
            <NineHoleRow
              label="Back 9"
              holes={activeRoundData?.holes.filter((h) => h.holeNumber > 9) || []}
              startHole={10}
              completedHoles={completedHoles}
              defaultPars={defaultPars}
            />
          </div>
          {activeRoundData && activeRoundData.holesCompleted > 0 && (
            <div className="flex items-center justify-between px-4 mt-4 pt-3 border-t border-white/10">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-[1.5px]">Total</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/50">{activeRoundData.holesCompleted} holes</span>
                <span className="text-lg font-bold text-white">{activeRoundData.totalStrokes}</span>
                <span className={`text-sm font-bold ${activeRoundData.totalToPar < 0 ? SCORE_COLORS.birdie.tailwindText : activeRoundData.totalToPar > 0 ? SCORE_COLORS.bogey.tailwindText : 'text-white/70'}`}>
                  {formatScoreToPar(activeRoundData.totalToPar)}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mt-4 px-4">
            {[
              { label: 'Eagle', color: SCORE_COLORS.eagle.tailwindBg },
              { label: 'Birdie', color: SCORE_COLORS.birdie.tailwindBg },
              { label: 'Par', color: SCORE_COLORS.par.tailwindBg },
              { label: 'Bogey', color: SCORE_COLORS.bogey.tailwindBg },
              { label: 'Double+', color: SCORE_COLORS.doublePlus.tailwindBg },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-[10px] text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Trophy className="w-6 h-6 text-white/40" />
          </div>
          <p className="text-sm text-white/40 text-center">Scorecard data updating...</p>
          <p className="text-xs text-white/25 text-center mt-1">Hole-by-hole scores will appear as the round progresses</p>
        </div>
      )}
    </motion.div>
  );
}
