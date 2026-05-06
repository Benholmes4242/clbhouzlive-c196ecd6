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
import { HeroAtmosphere } from '@/features/tourhub/components/shared/HeroAtmosphere';
import { Shimmer } from '@/features/tourhub/components/shared/Shimmer';
import { StatsGrid } from '@/features/tourhub/components/shared/StatsGrid';
import { RoundSparkline } from '@/features/tourhub/components/shared/RoundSparkline';
import {
  ink, inkSoft, inkFaint, inkGhost,
  hairlineDark, hairlineMid,
  gold, greenLive, danger, navyMid,
  fmtScore, fmtScoreSign, PULSE_KEYFRAMES,
} from '@/features/tourhub/utils/heroAtmosphere';

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
  isCompleted?: boolean;
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

// ── Hole Cell Component ────────────────────────────────────────────────────────

function HoleCell({ hole }: { hole: HoleScore }) {
  const c = getScoreColorSet(hole.scoreToPar);
  const isEagleOrBetter = hole.scoreToPar <= -2;
  const isBirdie = hole.scoreToPar === -1;
  const isPar = hole.scoreToPar === 0;
  const isBogey = hole.scoreToPar === 1;
  const isDoublePlus = hole.scoreToPar >= 2;

  // Shape: birdie/eagle = circle, par/bogey/double = square
  const isCircle = hole.scoreToPar <= -1;
  const borderRadius = isCircle ? '50%' : 5;

  // Double outline for eagle and double bogey+
  const outlineStyle = (isEagleOrBetter || isDoublePlus) ? {
    outline: `1px solid ${c.ring}`,
    outlineOffset: '1px',
  } : {};

  // Par uses dashed border
  const borderStyle = isPar ? `1.5px dashed ${c.ring}` : `1.5px solid ${c.ring}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 'clamp(9px, 2.8vw, 11px)', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>
        {hole.holeNumber}
      </span>
      <span style={{ fontSize: 'clamp(8px, 2.5vw, 10px)', color: 'rgba(255,255,255,0.30)' }}>
        {hole.par}
      </span>
      <div style={{
        width: 'clamp(28px, 8.5vw, 34px)', height: 'clamp(28px, 8.5vw, 34px)',
        borderRadius,
        border: borderStyle,
        background: isPar ? 'transparent' : c.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0,
        ...outlineStyle,
      } as React.CSSProperties}>
        <span style={{
          fontSize: 'clamp(11px, 3.3vw, 13px)', fontWeight: 800,
          color: c.text,
          lineHeight: 1,
        }}>
          {hole.strokes}
        </span>
        {!isPar && (
          <span style={{ fontSize: 'clamp(6px, 1.8vw, 7px)', fontWeight: 700, color: c.text, opacity: 0.75, lineHeight: 1, marginTop: 1 }}>
            {hole.scoreToPar < 0 ? `${hole.scoreToPar}` : `+${hole.scoreToPar}`}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyHoleCell({ holeNumber, par }: { holeNumber: number; par: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 'clamp(8px, 2.5vw, 10px)', fontWeight: 500, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {holeNumber}
      </span>
      <span style={{ fontSize: 'clamp(8px, 2.5vw, 10px)', color: 'rgba(255,255,255,0.30)' }}>
        {par}
      </span>
      <div style={{
        width: 'clamp(26px, 8vw, 32px)', height: 'clamp(26px, 8vw, 32px)',
        borderRadius: '50%',
        border: '1.5px dashed rgba(255,255,255,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 'clamp(8px, 2.5vw, 10px)', fontWeight: 600, color: 'rgba(255,255,255,0.20)' }}>—</span>
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
    <div style={{ padding: '0 clamp(8px, 2vw, 12px)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-white/45 uppercase tracking-[1.5px]">{label}</span>
        {hasAnyScore && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30">Par {outPar}</span>
            <span className="text-sm font-bold text-white/80">{outScore || '—'}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 'clamp(1px, 0.5vw, 4px)' }}>
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
  const tabs = [1, 2, 3, 4];
  return (
    <div style={{ padding: '0 16px 14px', display: 'flex', gap: 6 }}>
      {tabs.map((roundNum) => {
        const hasScorecard = rounds.some((r) => r.roundNumber === roundNum);
        const rs = roundScores.find((r) => r.round === roundNum);
        const hasData = hasScorecard || (rs && rs.holesCompleted > 0);
        const isActive = roundNum === activeRound;
        const isLive = roundNum === currentRound && (rs?.holesCompleted ?? 0) > 0 && (rs?.holesCompleted ?? 0) < 18;
        const toPar = rs?.toPar ?? null;

        return (
          <button
            key={roundNum}
            onClick={() => hasData && onSelect(roundNum)}
            disabled={!hasData}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 10,
              border: isActive
                ? `1.5px solid ${isLive ? greenLive : '#fff'}`
                : `1px solid ${hairlineDark}`,
              background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
              textAlign: 'center', cursor: hasData ? 'pointer' : 'default',
              opacity: hasData ? 1 : 0.4,
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                color: isActive ? (isLive ? greenLive : '#fff') : inkFaint,
              }}
            >
              R{roundNum}
            </div>
            <div
              style={{
                fontSize: 16, fontWeight: 800, marginTop: 3,
                color: isLive ? greenLive : '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {isLive ? 'LIVE' : toPar != null ? fmtScore(toPar) : '—'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Scorecard Skeleton ─────────────────────────────────────────────────────────

function ScorecardSkeleton() {
  return (
    <>
      <div style={{ padding: '0 20px 14px', display: 'flex', justifyContent: 'space-between' }}>
        <Shimmer width="28%" height={20} radius={4} />
        <Shimmer width="20%" height={20} radius={4} />
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        <Shimmer width="80%" height={14} radius={3} />
      </div>
      <div style={{ padding: '0 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Shimmer width={72} height={72} radius="50%" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Shimmer width="40%" height={11} radius={3} style={{ marginBottom: 8 }} />
          <Shimmer width="70%" height={22} radius={5} style={{ marginBottom: 8 }} />
          <Shimmer width="50%" height={11} radius={3} />
        </div>
        <Shimmer width="20%" height={48} radius={6} />
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <Shimmer width="100%" height={94} radius={14} />
      </div>
      <div style={{ padding: '0 16px 14px', display: 'flex', gap: 6 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} height={50} radius={10} style={{ flex: 1 }} />
        ))}
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <Shimmer width="100%" height={70} radius={14} />
      </div>
      <div style={{ padding: '0 12px 14px' }}>
        <Shimmer width="40%" height={9} radius={3} style={{ marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Shimmer key={i} height={60} radius={6} />
          ))}
        </div>
      </div>
      <div style={{ padding: '0 12px 14px' }}>
        <Shimmer width="40%" height={9} radius={3} style={{ marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Shimmer key={i} height={60} radius={6} />
          ))}
        </div>
      </div>
      <div style={{ padding: '0 16px 18px' }}>
        <Shimmer width="100%" height={50} radius={14} />
      </div>
    </>
  );
}

function TournamentProgressionPanel({
  rounds,
  isCompleted,
}: {
  rounds: { round: number; toPar: number | null }[];
  isCompleted: boolean;
}) {
  const completed = rounds.filter((r) => r.toPar != null) as { round: number; toPar: number }[];
  if (completed.length < 2) {
    return (
      <div
        style={{
          margin: '0 16px 14px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 14,
          border: `1px solid ${hairlineDark}`,
          padding: '18px 14px',
          textAlign: 'center',
          color: inkFaint, fontSize: 11,
        }}
      >
        Score progression appears once you've finished R2.
      </div>
    );
  }
  const accent = isCompleted ? gold : greenLive;
  const cumulative = completed.reduce<number[]>((acc, r) => {
    acc.push((acc[acc.length - 1] ?? 0) + r.toPar);
    return acc;
  }, []);
  const final = cumulative[cumulative.length - 1];

  return (
    <div
      style={{
        margin: '0 16px 14px',
        background: 'rgba(255,255,255,0.025)',
        borderRadius: 14,
        border: `1px solid ${hairlineDark}`,
        padding: '12px 14px 10px',
      }}
    >
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: inkFaint }}>
          TOURNAMENT · SCORE PROGRESSION
        </span>
        <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>
          {fmtScore(final)} thru R{completed.length}
        </span>
      </div>
      <RoundSparkline rounds={cumulative} accent={accent} cumulative />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PlayerScorecardCard({
  player,
  tournamentId,
  tournamentName,
  isCompleted = false,
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

  // Inject pulse keyframes once for the live indicator.
  useEffect(() => {
    const id = 'hero-pulse-keyframes';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = PULSE_KEYFRAMES;
    document.head.appendChild(tag);
  }, []);

  const flag = COUNTRY_TO_FLAG[(player.countryCode ?? '').toUpperCase()];
  const positionLabel = typeof player.position === 'number'
    ? `${player.position}`
    : `${player.position}`;

  return (
    <HeroAtmosphere
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="flex flex-col"
        style={{
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
        }}
      >
        {/* ── 1. TOP BAR — back nav ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px 14px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16, color: inkSoft }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: inkSoft, letterSpacing: '0.01em' }}>
              Leaderboard
            </span>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X style={{ width: 16, height: 16, color: inkFaint }} />
          </button>
        </div>

        {/* ── 2. BROADCAST CAPTION STRIP ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 20px 14px',
            flexShrink: 0,
          }}
        >
          {isCompleted ? (
            <span
              style={{
                padding: '3px 7px', borderRadius: 4,
                background: 'rgba(255,184,0,0.14)', color: gold,
                fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                border: `1px solid rgba(255,184,0,0.30)`,
              }}
            >
              FINAL
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 6, height: 6, borderRadius: '50%', background: greenLive,
                  animation: 'heroPulse 1.6s infinite',
                }}
              />
              <span
                style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                  color: greenLive,
                }}
              >
                LIVE
              </span>
            </div>
          )}
          <span style={{ fontSize: 10, color: inkFaint }}>·</span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: inkSoft, letterSpacing: '0.06em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
            }}
          >
            {tournamentName ? `${tournamentName.toUpperCase()} · ` : ''}
            {isCompleted ? '72 HOLES COMPLETE' : `ROUND ${currentRound}`}
          </span>
        </div>

        {/* ── 3. PLAYER HERO ── */}
        <div
          style={{
            display: 'flex', alignItems: 'stretch', gap: 14,
            padding: '0 20px 18px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => navigate(`/tourhub/player/${player.id}`)}
            style={{
              flexShrink: 0, position: 'relative',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
            className="active:scale-95 transition-transform"
          >
            <div
              style={{
                width: 50, height: 50, borderRadius: '50%',
                border: `2px solid ${isCompleted ? gold : greenLive}`,
                background: 'rgba(0,0,0,0.3)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%' }}
                />
              ) : (
                <span style={{ fontSize: 18, fontWeight: 800, color: inkFaint }}>
                  {player.firstName?.[0]}{player.lastName?.[0]}
                </span>
              )}
            </div>
            <div
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: '50%',
                background: isCompleted ? gold : greenLive,
                color: isCompleted ? ink : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${navyMid}`,
                fontSize: 9, fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {positionLabel}
            </div>
          </button>

          <div
            style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                color: isCompleted ? gold : inkFaint,
                marginBottom: 4,
              }}
            >
              {isCompleted ? 'FINAL POSITION' : 'PLAYER'}
              {flag ? ` · ${flag}` : ''}
              {player.countryCode ? ` ${player.countryCode.toUpperCase()}` : ''}
            </div>
            <div
              style={{
                fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
                color: '#fff', lineHeight: 1.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {player.name}
            </div>
            {!isCompleted && player.thru && player.thru !== 'F' && (
              <div
                style={{
                  fontSize: 11, color: greenLive, marginTop: 6, fontWeight: 600,
                }}
              >
                Thru {player.thru} · R{currentRound}
              </div>
            )}
            {isCompleted && (
              <div
                style={{
                  fontSize: 11, color: inkFaint, marginTop: 6, fontWeight: 600,
                }}
              >
                72 holes · Final
              </div>
            )}
          </div>

          <div
            style={{
              textAlign: 'right',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em',
                color: (isCompleted && (player.position === 1 || String(player.position) === '1')) ? gold : '#fff',
                lineHeight: 0.9,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtScore(player.totalScore)}
            </span>
          </div>
        </div>

        {/* ── 4. SCORECARD CONTENT — scrollable ── */}
        {isLoading ? (
          <ScorecardSkeleton />
        ) : scorecard && scorecard.rounds.length > 0 ? (
          <div
            style={{
              flex: 1, overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' as any,
              willChange: 'transform',
            }}
          >
            {/* Cross-round progression */}
            <TournamentProgressionPanel rounds={roundScores} isCompleted={isCompleted} />

            {/* Round tabs — pill buttons */}
            <RoundTabs
              rounds={scorecard.rounds}
              activeRound={activeRound}
              currentRound={currentRound}
              onSelect={setActiveRound}
              roundScores={roundScores}
            />


            {/* Stats — flat horizontal panel */}
            {activeRoundData && activeRoundData.holesCompleted > 0 && (
              <div style={{ padding: '0 16px' }}>
                <StatsGrid
                  stats={{
                    eagles: activeRoundData.eagles,
                    birdies: activeRoundData.birdies,
                    pars: activeRoundData.pars,
                    bogeys: activeRoundData.bogeys,
                    doubleBogeys: activeRoundData.doubleBogeys,
                  }}
                />

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
            <div style={{ marginTop: 12 }}>
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
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px 18px',
                  marginTop: 10,
                  borderTop: `1px solid ${hairlineDark}`,
                }}
              >
                <span
                  style={{
                    fontSize: 9, fontWeight: 800, color: inkFaint,
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                  }}
                >
                  Total · {activeRoundData.holesCompleted} holes
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span
                    style={{
                      fontSize: 14, fontWeight: 600, color: inkSoft,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {activeRoundData.totalStrokes}
                  </span>
                  <span
                    style={{
                      fontSize: 24, fontWeight: 800,
                      color: activeRoundData.totalToPar < 0 ? '#ffffff'
                           : activeRoundData.totalToPar > 0 ? danger
                           : inkFaint,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {fmtScore(activeRoundData.totalToPar)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hairlineDark}` }}
            >
              <Trophy className="w-6 h-6" style={{ color: inkFaint }} />
            </div>
            <p className="text-sm text-center" style={{ color: inkFaint }}>Scorecard data updating…</p>
            <p className="text-xs text-center mt-1" style={{ color: inkGhost }}>
              Hole-by-hole scores will appear as the round progresses
            </p>
          </div>
        )}
      </motion.div>
    </HeroAtmosphere>
  );
}
