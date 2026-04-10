/**
 * PlayerScorecardCard — Scorecard content rendered inside the expanded glass card.
 * No own background — the parent HeroSlide glass card provides blur/overlay.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Trophy } from 'lucide-react';
import { usePlayerScorecard, type RoundScorecard, type HoleScore } from '@/hooks/usePlayerScorecard';
import { getScoreTextClass, getScoreBgClass, getScoreColorSet, SCORE_COLORS } from '@/features/tourhub/utils/scoreColors';

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

const COUNTRY_TO_FLAG: Record<string, string> = {
  'UNITED STATES': '🇺🇸', 'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'NORTHERN IRELAND': '🇮🇪', 'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'IRELAND': '🇮🇪',
  'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦', 'JAPAN': '🇯🇵',
  'SOUTH AFRICA': '🇿🇦', 'SPAIN': '🇪🇸', 'GERMANY': '🇩🇪',
  'FRANCE': '🇫🇷', 'SWEDEN': '🇸🇪', 'NORWAY': '🇳🇴',
  'DENMARK': '🇩🇰', 'SOUTH KOREA': '🇰🇷', 'CHINA': '🇨🇳',
  'NEW ZEALAND': '🇳🇿', 'ARGENTINA': '🇦🇷', 'COLOMBIA': '🇨🇴',
  'ITALY': '🇮🇹', 'BELGIUM': '🇧🇪', 'NETHERLANDS': '🇳🇱',
  'ZIMBABWE': '🇿🇼', 'INDIA': '🇮🇳', 'FINLAND': '🇫🇮',
  'CHINESE TAIPEI': '🇹🇼', 'MEXICO': '🇲🇽', 'BRAZIL': '🇧🇷',
  'FIJI': '🇫🇯', 'THAILAND': '🇹🇭', 'PHILIPPINES': '🇵🇭',
};

function formatScoreToPar(score: number): string {
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

// ── Sparkline Component ────────────────────────────────────────────────────────

function ScorecardSparkline({ holes }: { holes: HoleScore[] }) {
  if (holes.length < 2) return null;
  const running = holes.reduce<number[]>((acc, h, i) => {
    acc.push((acc[i - 1] ?? 0) + h.scoreToPar);
    return acc;
  }, []);
  const min = Math.min(...running, 0);
  const max = Math.max(...running, 0);
  const range = max - min || 1;
  const W = 300, H = 28;
  const pts = running.map((v, i) => {
    const x = (i / (running.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const lastV = running[running.length - 1];
  const lastY = H - ((lastV - min) / range) * (H - 4) - 2;
  return (
    <div style={{ padding: '0 16px 6px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lastV <= 0 ? '#F7931E' : '#EF4444'} stopOpacity={0.18} />
            <stop offset="100%" stopColor={lastV <= 0 ? '#F7931E' : '#EF4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={lastV <= 0 ? '#F7931E' : '#EF4444'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#sparkFill)" />
        <line x1={0} y1={H - ((0 - min) / range) * (H - 4) - 2} x2={W} y2={H - ((0 - min) / range) * (H - 4) - 2} stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} strokeDasharray="3,3" />
        <circle cx={W} cy={lastY} r={2.5} fill={lastV <= 0 ? '#F7931E' : '#EF4444'} opacity={0.9} />
      </svg>
    </div>
  );
}

// ── Hole Cell Component ────────────────────────────────────────────────────────

function HoleCell({ hole }: { hole: HoleScore }) {
  const c = getScoreColorSet(hole.scoreToPar);
  const isCircle = hole.scoreToPar <= -1;
  const isSquare = hole.scoreToPar >= 1;
  const isPar = hole.scoreToPar === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {hole.holeNumber}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>
        {hole.par}
      </span>
      <div style={{
        width: 32, height: 32,
        borderRadius: isCircle ? '50%' : isSquare ? 5 : '50%',
        border: isPar ? '1.5px dashed rgba(255,255,255,0.18)' : `1.5px solid ${c.ring}`,
        background: isPar ? 'transparent' : c.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        <span style={{
          fontSize: isPar ? 10 : 13,
          fontWeight: isPar ? 600 : 800,
          color: isPar ? 'rgba(255,255,255,0.45)' : c.text,
          lineHeight: 1,
        }}>
          {isPar ? '—' : hole.strokes}
        </span>
        {!isPar && (
          <span style={{ fontSize: 7, fontWeight: 700, color: c.text, opacity: 0.7, lineHeight: 1 }}>
            {hole.scoreToPar < 0 ? `${hole.scoreToPar}` : `+${hole.scoreToPar}`}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyHoleCell({ holeNumber, par }: { holeNumber: number; par: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {holeNumber}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>
        {par}
      </span>
      <div style={{
        width: 32, height: 32,
        borderRadius: '50%',
        border: '1.5px dashed rgba(255,255,255,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.20)' }}>—</span>
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
  roundScores,
}: {
  rounds: RoundScorecard[];
  activeRound: number;
  currentRound: number;
  onSelect: (round: number) => void;
  roundScores: { round: number; strokes: number; toPar: number; holesCompleted: number }[];
}) {
  const maxRound = Math.max(currentRound, 4);
  const tabs = Array.from({ length: maxRound }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', gap: 5, padding: '4px 16px 10px', width: 'fit-content' }}>
      {tabs.map((roundNum) => {
        const rs = roundScores.find(r => r.round === roundNum);
        const hasData = rs && rs.holesCompleted > 0;
        const isActive = roundNum === activeRound;
        const toPar = rs?.toPar ?? null;
        const fmtScore = toPar === null ? null
          : toPar === 0 ? 'E'
          : toPar > 0 ? `+${toPar}`
          : `${toPar}`;
        const scoreColor = toPar === null ? 'rgba(255,255,255,0.20)'
          : toPar < 0 ? '#F7931E'
          : toPar > 0 ? '#EF4444'
          : 'rgba(255,255,255,0.55)';

        return (
          <button
            key={roundNum}
            onClick={() => hasData && onSelect(roundNum)}
            disabled={!hasData}
            style={{
              minWidth: 44,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 4px',
              borderRadius: 9,
              background: isActive
                ? 'rgba(247,147,30,0.10)'
                : 'rgba(255,255,255,0.04)',
              border: isActive
                ? '1.5px solid rgba(247,147,30,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
              cursor: hasData ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              R{roundNum}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: hasData ? scoreColor : 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {fmtScore ?? '—'}
            </span>
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
    player.currentRound || 1
  );
  const hasInitialisedRound = useRef(false);

  useEffect(() => {
    if (scorecard?.currentRound && !hasInitialisedRound.current) {
      hasInitialisedRound.current = true;
      setActiveRound(scorecard.currentRound);
    }
  }, [scorecard?.currentRound]);

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
      <div className="scorecard-top-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: 16, paddingRight: 16, paddingBottom: 8,
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
            {COUNTRY_TO_FLAG[(player.countryCode ?? '').toUpperCase()] && (
              <span style={{ marginRight: 4 }}>
                {COUNTRY_TO_FLAG[(player.countryCode ?? '').toUpperCase()]}
              </span>
            )}
            {player.thru === 'F' ? 'Finished' : player.thru ? `Thru ${player.thru}` : 'Round 1'}
            {player.currentRound ? ` · Round ${player.currentRound}` : ''}
          </span>
        </div>

        {/* Total score — Change 7: canonical amber/red */}
        <span style={{
          fontSize: 28, fontWeight: 900,
          color: player.totalScore < 0 ? '#F7931E' : player.totalScore === 0 ? 'rgba(255,255,255,0.75)' : '#EF4444',
          fontFamily: "'JetBrains Mono','SF Mono',monospace",
          letterSpacing: -1, flexShrink: 0,
        }}>
          {formatScoreToPar(player.totalScore)}
        </span>
      </div>


      {/* Sparkline — above separator */}
      {activeRoundData && activeRoundData.holesCompleted > 0 && (
        <ScorecardSparkline holes={activeRoundData.holes} />
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
            roundScores={roundScores}
          />

          {/* Stat chips — Change 6: canonical colours */}
          {activeRoundData && activeRoundData.holesCompleted > 0 && (
            <div style={{ display: 'flex', gap: 4, padding: '0 16px 8px' }}>
              {[
                { v: activeRoundData.eagles,       label: 'Eagles',  color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
                { v: activeRoundData.birdies,      label: 'Birdies', color: '#F7931E', bg: 'rgba(247,147,30,0.08)' },
                { v: activeRoundData.pars,         label: 'Pars',    color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.04)' },
                { v: activeRoundData.bogeys,       label: 'Bogeys',  color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                { v: activeRoundData.doubleBogeys, label: 'Doubles', color: '#991B1B', bg: 'rgba(153,27,27,0.08)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, textAlign: 'center',
                  padding: '5px 2px 4px',
                  borderRadius: 7,
                  background: stat.bg,
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
              padding: '10px 16px',
              marginTop: 6,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total · {activeRoundData.holesCompleted} holes
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.70)' }}>
                  {activeRoundData.totalStrokes}
                </span>
                <span style={{
                  fontSize: 20, fontWeight: 800,
                  color: activeRoundData.totalToPar < 0 ? '#F7931E'
                       : activeRoundData.totalToPar > 0 ? '#EF4444'
                       : 'rgba(255,255,255,0.55)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatScoreToPar(activeRoundData.totalToPar)}
                </span>
              </div>
            </div>
          )}

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
