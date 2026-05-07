/**
 * PlayerScorecardCard — Editorial light-theme scorecard hero (C2 Editorial · Elastic).
 *
 * - Light theme on #F8FAFC, hard-cap to parent 70dvh, no internal scroll.
 * - ElasticZone header (back nav + caption + player block) absorbs slack.
 * - Below first divider: round tabs, Front 9 / Back 9 strips, total row.
 * - Bottom CTA: "View Full Player Profile" → playerRoute(id, { kind: 'tournament', tournamentName }).
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Trophy } from 'lucide-react';
import { usePlayerScorecard, type RoundScorecard, type HoleScore } from '@/hooks/usePlayerScorecard';
import { Shimmer } from '@/features/tourhub/components/shared/Shimmer';
import { ElasticZone } from '@/features/tourhub/components/shared/ElasticZone';
import { HeroCTA } from '@/features/tourhub/components/shared/HeroCTA';
import { playerRoute } from '@/features/tourhub/routes';
import {
  ink, gold, greenLive, danger,
  lightBg, slate100, slate200, slate300, slate400, slate500,
  fmtScore, PULSE_KEYFRAMES,
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

// ── Light-theme score colors ──────────────────────────────────────────────────

function lightScoreColors(scoreToPar: number) {
  // eagle/birdie = ink filled circle, white text
  if (scoreToPar <= -1) {
    return { text: '#FFFFFF', bg: ink, ring: ink, kind: 'circle' as const };
  }
  // par = neutral dashed
  if (scoreToPar === 0) {
    return { text: slate500, bg: 'transparent', ring: slate300, kind: 'square' as const };
  }
  // bogey = red outline
  if (scoreToPar === 1) {
    return { text: danger, bg: 'rgba(248,113,113,0.08)', ring: danger, kind: 'square' as const };
  }
  // double+
  return { text: danger, bg: 'rgba(248,113,113,0.12)', ring: danger, kind: 'square' as const };
}

// ── Hole Cell ─────────────────────────────────────────────────────────────────

function HoleCell({ hole }: { hole: HoleScore }) {
  const c = lightScoreColors(hole.scoreToPar);
  const isCircle = c.kind === 'circle';
  const borderRadius = isCircle ? '50%' : 4;
  const isPar = hole.scoreToPar === 0;
  const isDoublePlus = hole.scoreToPar >= 2;

  const outlineStyle = isDoublePlus ? {
    outline: `1px solid ${c.ring}`,
    outlineOffset: '1px',
  } : {};

  const borderStyle = isPar ? `1px dashed ${c.ring}` : `1px solid ${c.ring}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: slate400, letterSpacing: '0.04em' }}>
        {hole.holeNumber}
      </span>
      <span style={{ fontSize: 8, color: slate300, fontWeight: 600 }}>
        {hole.par}
      </span>
      <div style={{
        width: 'clamp(22px, 6.6vw, 28px)', height: 'clamp(22px, 6.6vw, 28px)',
        borderRadius,
        border: borderStyle,
        background: c.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...outlineStyle,
      } as React.CSSProperties}>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: c.text,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {hole.strokes}
        </span>
      </div>
    </div>
  );
}

function EmptyHoleCell({ holeNumber, par }: { holeNumber: number; par: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: slate300, letterSpacing: '0.04em' }}>
        {holeNumber}
      </span>
      <span style={{ fontSize: 8, color: slate300, fontWeight: 600 }}>
        {par}
      </span>
      <div style={{
        width: 'clamp(22px, 6.6vw, 28px)', height: 'clamp(22px, 6.6vw, 28px)',
        borderRadius: 4,
        border: `1px dashed ${slate200}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: slate300 }}>—</span>
      </div>
    </div>
  );
}

// ── Nine-Hole Row ─────────────────────────────────────────────────────────────

function NineHoleRow({
  label, startHole, completedHoles, defaultPars,
}: {
  label: string;
  startHole: number;
  completedHoles: Map<number, HoleScore>;
  defaultPars: Record<number, number>;
}) {
  const nineHoles = Array.from({ length: 9 }, (_, i) => completedHoles.get(startHole + i));
  const outScore = nineHoles.reduce((sum, h) => sum + (h?.strokes || 0), 0);
  const outPar = nineHoles.reduce((sum, h, i) => sum + (h?.par || defaultPars[startHole + i] || 4), 0);
  const hasAnyScore = nineHoles.some((h) => h !== undefined);

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: slate400, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {hasAnyScore && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: slate400, fontWeight: 600 }}>Par {outPar}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: ink, fontVariantNumeric: 'tabular-nums' }}>
              {outScore || '—'}
            </span>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3 }}>
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

// ── Round Tabs ────────────────────────────────────────────────────────────────

function RoundTabs({
  rounds, activeRound, currentRound, onSelect, roundScores,
}: {
  rounds: RoundScorecard[];
  activeRound: number;
  currentRound: number;
  onSelect: (round: number) => void;
  roundScores: { round: number; strokes: number; toPar: number; holesCompleted: number }[];
}) {
  const tabs = [1, 2, 3, 4];
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
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
              flex: 1, padding: '7px 6px', borderRadius: 8,
              border: isActive
                ? `1.5px solid ${isLive ? greenLive : ink}`
                : `1px solid ${slate200}`,
              background: isActive ? '#FFFFFF' : 'transparent',
              textAlign: 'center', cursor: hasData ? 'pointer' : 'default',
              opacity: hasData ? 1 : 0.45,
            }}
          >
            <div style={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em',
              color: isActive ? (isLive ? greenLive : ink) : slate400,
            }}>
              R{roundNum}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 800, marginTop: 2,
              color: isLive ? greenLive : ink,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {isLive ? 'LIVE' : toPar != null ? fmtScore(toPar) : '—'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Hole Progression Sparkline (per-hole, light theme) ──────────────────────

function HoleProgressionSparkline({
  holes, accent, holesCompleted,
}: {
  holes: HoleScore[];
  accent: string;
  holesCompleted: number;
}) {
  const points: Array<{ x: number; y: number }> = [];
  let running = 0;
  holes.forEach((h, i) => {
    if (h.scoreToPar == null) return;
    running += h.scoreToPar;
    points.push({ x: i, y: running });
  });
  if (points.length < 2) return null;
  const W = 320, H = 50, PAD = 6;
  const ys = points.map(p => p.y);
  const yMin = Math.min(0, ...ys, -1);
  const yMax = Math.max(0, ...ys, 1);
  const sx = (i: number) => PAD + (i / 17) * (W - PAD * 2);
  const sy = (y: number) => PAD + ((yMax - y) / (yMax - yMin)) * (H - PAD * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ');
  const last = points[points.length - 1];
  const areaPath = `${path} L ${sx(last.x)} ${sy(yMin)} L ${sx(0)} ${sy(yMin)} Z`;
  const totalToPar = last.y;

  return (
    <div style={{ flexShrink: 0, marginTop: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', color: slate400,
        }}>
          ROUND PROGRESSION
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: accent,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtScore(totalToPar)} thru {holesCompleted}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="hpsg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={PAD} x2={W - PAD} y1={sy(0)} y2={sy(0)}
          stroke={slate200} strokeWidth="1" strokeDasharray="2 3"
        />
        <path d={areaPath} fill="url(#hpsg)" />
        <path
          d={path} fill="none" stroke={accent}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={sx(last.x)} cy={sy(last.y)} r="3.5"
          fill={accent} stroke="#fff" strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// ── Scorecard Round Stats (light theme) ─────────────────────────────────────

function ScorecardRoundStats({
  holes, accent,
}: {
  holes: HoleScore[];
  accent: string;
}) {
  const played = holes.filter(h => h.scoreToPar != null);
  if (played.length === 0) return null;
  const birdies = played.filter(h => h.scoreToPar! <= -1).length;
  const pars    = played.filter(h => h.scoreToPar === 0).length;
  const bogeys  = played.filter(h => h.scoreToPar! >= 1).length;
  const holesPlayed = played.length;
  const cells: Array<{ v: string | number; label: string; color: string }> = [
    { v: birdies,     label: 'BIRDIES', color: birdies > 0 ? accent : slate400 },
    { v: pars,        label: 'PARS',    color: ink },
    { v: bogeys,      label: 'BOGEYS',  color: bogeys > 0 ? danger : slate400 },
    { v: holesPlayed, label: 'HOLES',   color: ink },
  ];
  return (
    <div style={{
      flexShrink: 0,
      marginTop: 12,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      borderTop: `1px solid ${slate200}`,
      borderBottom: `1px solid ${slate200}`,
      padding: '10px 0',
    }}>
      {cells.map((c, i) => (
        <div key={c.label} style={{
          textAlign: 'center', minWidth: 0,
          borderLeft: i > 0 ? `1px solid ${slate200}` : 'none',
          padding: '0 4px',
        }}>
          <div style={{
            fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
          }}>
            {c.v}
          </div>
          <div style={{
            fontSize: 8, fontWeight: 800, color: slate400,
            letterSpacing: '0.12em', marginTop: 5,
          }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScorecardSkeleton() {
  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} height={42} radius={8} style={{ flex: 1 }} />
        ))}
      </div>
      <Shimmer width="40%" height={9} radius={3} style={{ marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3, marginBottom: 12 }}>
        {Array.from({ length: 9 }).map((_, i) => <Shimmer key={i} height={52} radius={4} />)}
      </div>
      <Shimmer width="40%" height={9} radius={3} style={{ marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 3 }}>
        {Array.from({ length: 9 }).map((_, i) => <Shimmer key={i} height={52} radius={4} />)}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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
  const [activeRound, setActiveRound] = useState<number>(player.currentRound || 1);
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

  const handleViewProfile = () => {
    const target = playerRoute(player.id, {
      kind: 'tournament',
      tournamentName: tournamentName || 'Tournament',
    });
    navigate(target.to, { state: target.state });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      style={{
        height: '100%',
        background: lightBg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
        paddingInline: 20,
        paddingBottom: 16,
        boxSizing: 'border-box',
      }}
    >
      {/* ─── ELASTIC HEADER: nav + caption + player block ─── */}
      <ElasticZone minH={120} maxH={240}>
        {(t) => {
          const avatarSize = 50 + t * 18;   // 50 → 68
          const nameSize   = 22 + t * 16;   // 22 → 38
          const scoreSize  = 30 + t * 14;   // 30 → 44
          const accent = isCompleted ? gold : greenLive;
          const captionGap = 8 + t * 4;

          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Top nav */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: captionGap,
              }}>
                <button
                  onClick={onBack}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  <ChevronLeft style={{ width: 16, height: 16, color: slate500 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: slate500, letterSpacing: '0.01em' }}>
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
                  <X style={{ width: 16, height: 16, color: slate400 }} />
                </button>
              </div>

              {/* Caption strip — eyebrow style */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: captionGap + 2,
              }}>
                <span aria-hidden style={{ width: 18, height: 1.5, background: isCompleted ? gold : greenLive, flexShrink: 0 }} />
                {isCompleted ? (
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: gold,
                  }}>
                    FINAL · 72 HOLES
                  </span>
                ) : (
                  <>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: greenLive,
                      animation: 'heroPulse 1.6s infinite',
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: greenLive,
                    }}>
                      LIVE · ROUND {currentRound}
                    </span>
                  </>
                )}
                <span style={{ flex: 1, height: 1, background: slate200 }} />
                {tournamentName && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em',
                    color: slate500, textTransform: 'uppercase',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '50%',
                  }}>
                    {tournamentName}
                  </span>
                )}
              </div>

              {/* Player block */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <button
                  onClick={handleViewProfile}
                  style={{
                    flexShrink: 0, position: 'relative',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                  className="active:scale-95 transition-transform"
                >
                  <div style={{
                    width: avatarSize, aspectRatio: '1 / 1.05', borderRadius: '34%',
                    border: `2px solid ${accent}`,
                    background: slate100,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%' }}
                      />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 800, color: slate400 }}>
                        {player.firstName?.[0]}{player.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    minWidth: 22, height: 22, padding: '0 5px', borderRadius: 11,
                    background: accent,
                    color: isCompleted ? ink : '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${lightBg}`,
                    fontSize: 9.5, fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {positionLabel}
                  </div>
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                    color: isCompleted ? gold : slate400,
                    marginBottom: 4, textTransform: 'uppercase',
                  }}>
                    {isCompleted ? 'FINAL POSITION' : 'PLAYER'}
                    {flag ? ` · ${flag}` : ''}
                    {player.countryCode ? ` ${player.countryCode.toUpperCase()}` : ''}
                  </div>
                  <div style={{
                    fontSize: nameSize, fontWeight: 900, letterSpacing: '-0.02em',
                    color: ink, lineHeight: 1.05,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {player.name}
                  </div>
                  {!isCompleted && player.thru && player.thru !== 'F' && (
                    <div style={{
                      fontSize: 10.5, color: greenLive, marginTop: 4, fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}>
                      Thru {player.thru} · R{currentRound}
                    </div>
                  )}
                  {isCompleted && (
                    <div style={{
                      fontSize: 10.5, color: slate500, marginTop: 4, fontWeight: 600,
                    }}>
                      72 holes · Final
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: scoreSize, fontWeight: 900, letterSpacing: '-0.04em',
                    color: (isCompleted && (player.position === 1 || String(player.position) === '1')) ? gold : ink,
                    lineHeight: 0.9,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtScore(player.totalScore)}
                  </span>
                  <div style={{
                    marginTop: 4, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
                    color: slate400,
                  }}>
                    TO PAR
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </ElasticZone>

      {/* ─── DIVIDER ─── */}
      <div style={{
        flexShrink: 0,
        height: 1, background: slate200,
        margin: '12px 0 10px',
      }} />

      {/* ─── SCORECARD CONTENT ─── */}
      <div style={{ flexShrink: 0 }}>
        {isLoading ? (
          <ScorecardSkeleton />
        ) : scorecard && scorecard.rounds.length > 0 ? (
          <>
            <RoundTabs
              rounds={scorecard.rounds}
              activeRound={activeRound}
              currentRound={currentRound}
              onSelect={setActiveRound}
              roundScores={roundScores}
            />

            <div style={{ marginTop: 4 }}>
              <NineHoleRow
                label="Front 9"
                startHole={1}
                completedHoles={completedHoles}
                defaultPars={defaultPars}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <NineHoleRow
                label="Back 9"
                startHole={10}
                completedHoles={completedHoles}
                defaultPars={defaultPars}
              />
            </div>

            {activeRoundData && activeRoundData.holesCompleted > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 4px 0',
                marginTop: 8,
                borderTop: `1px solid ${slate200}`,
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: slate400,
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                }}>
                  Total · {activeRoundData.holesCompleted} holes
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: slate500,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {activeRoundData.totalStrokes}
                  </span>
                  <span style={{
                    fontSize: 18, fontWeight: 900,
                    color: activeRoundData.totalToPar < 0 ? ink
                         : activeRoundData.totalToPar > 0 ? danger
                         : slate500,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                  }}>
                    {fmtScore(activeRoundData.totalToPar)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 0',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: slate100, border: `1px solid ${slate200}`,
              marginBottom: 10,
            }}>
              <Trophy style={{ width: 22, height: 22, color: slate400 }} />
            </div>
            <p style={{ fontSize: 12.5, color: slate500, fontWeight: 600, textAlign: 'center' }}>
              Scorecard data updating…
            </p>
            <p style={{ fontSize: 10.5, color: slate400, marginTop: 4, textAlign: 'center' }}>
              Hole-by-hole scores will appear as the round progresses
            </p>
          </div>
        )}
      </div>

      {/* ─── CTA ─── */}
      
      <HeroCTA
        label="View Full Player Profile"
        onClick={handleViewProfile}
      />
    </motion.div>
  );
}
