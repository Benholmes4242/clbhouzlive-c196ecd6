/**
 * LowestHandicapLeaderboard — Front Page composition.
 *
 * ⚠️ INVERTED TREND COLOURS ON THIS SURFACE ⚠️
 * Lower handicap is better. Anywhere we render a handicap delta we use the
 * semantic direction ('improving' | 'drifting' | 'steady') — never 'up'/'down' —
 * to prevent accidental colour-inversion regressions:
 *   - improving → ↓ green   (#15803D)  (handicap decreased)
 *   - drifting  → ↑ crimson (#9F1D1D)  (handicap increased)
 *   - steady    → — grey
 * This is the OPPOSITE of every other leaderboard surface. Do not "fix" it.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useLowestHandicapLeaderboard,
  useUserHandicapStatus,
  useUserHandicapTrajectory,
  useSimilarHandicapLeaderboard,
} from '@/hooks/leaderboards';
import { useDailyEditorial } from '@/hooks/championship';
import {
  formatHcp,
  getHandicapTier,
  getHandicapStatusLabel,
  getTierAbbr,
  getTierShortName,
  getTierThresholdRange,
  getTierUpperBound,
  isTierSharper,
  type HandicapTier,
} from '@/lib/formatHcp';
import { getProfilePathById } from '@/lib/profileRoutes';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorialLedeSkeleton } from '@/components/leaderboards/shared/EditorialLedeSkeleton';
import type { PeerGroup } from './HandicapTab';
import type { LowestHandicapEntry } from '@/types/leaderboards';

// ── Editorial palette ────────────────────────────────────────────────────
const BG = '#F8FAFC';
const INK = '#0F172A';
const INK_BODY = '#475569';
const INK_MUTED = '#64748B';
const INK_FAINT = '#94A3B8';
const HAIRLINE = '#CBD5E1';
const CRIMSON = '#9F1D1D';
const AMBER = '#F7931E';
const SUCCESS = '#15803D';
const DARK = '#0F172A';

// ── Helpers ──────────────────────────────────────────────────────────────

function formatHandicapDistance(distance: number): string {
  if (distance < 0.1) return '<0.1';
  return distance.toFixed(1);
}

interface HandicapChaseStatement {
  priority: number;
  text: string;
  emphasis?: 'positive' | 'negative' | 'neutral';
}

interface BuildHandicapChaseArgs {
  userHandicap: number;
  userTier: HandicapTier;
  trajectoryBest: number | null;
  yoyImprovement: number | null;
  closestRivalAhead: { name: string; gap: number } | null;
}

function buildHandicapChaseStatements(args: BuildHandicapChaseArgs): HandicapChaseStatement[] {
  const out: HandicapChaseStatement[] = [];

  // P1 — Distance to next sharper tier
  const tierOrder: HandicapTier[] = ['elite', 'scratch', 'player', 'single', 'midfielder', 'weekend', 'hacker'];
  const currentIdx = tierOrder.indexOf(args.userTier);
  if (currentIdx > 0) {
    const sharperTier = tierOrder[currentIdx - 1];
    const sharperUpperBound = getTierUpperBound(sharperTier);
    const distance = args.userHandicap - sharperUpperBound;
    if (distance > 0 && distance <= 5.0) {
      out.push({
        priority: 1,
        text: `Drop ${formatHandicapDistance(distance)} to reach ${getTierShortName(sharperTier)}.`,
        emphasis: 'positive',
      });
    }
  }

  // P2 — Closest rival overtake
  if (args.closestRivalAhead && args.closestRivalAhead.gap > 0 && args.closestRivalAhead.gap <= 3.0) {
    out.push({
      priority: 2,
      text: `${args.closestRivalAhead.name} is ${formatHandicapDistance(args.closestRivalAhead.gap)} ahead — close to draw level.`,
      emphasis: 'neutral',
    });
  }

  // P3 — Improvement streak (12-month)
  if (args.yoyImprovement !== null && args.yoyImprovement > 0.3) {
    out.push({
      priority: 3,
      text: `Down ${args.yoyImprovement.toFixed(1)} over 12 months — keep going.`,
      emphasis: 'positive',
    });
  }

  // P4 — Peak status
  if (args.trajectoryBest !== null && Math.abs(args.userHandicap - args.trajectoryBest) < 0.05) {
    out.push({
      priority: 4,
      text: `${formatHcp(args.userHandicap)} matches your 12-month best — holding peak.`,
      emphasis: 'positive',
    });
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

function getMastheadSubtitle(peerGroup: PeerGroup, clubName: string | null): string {
  switch (peerGroup) {
    case 'club': {
      if (!clubName) return 'AT YOUR CLUB';
      const upper = clubName.toUpperCase();
      if (upper.length > 24) return 'AT YOUR CLUB';
      if (upper.length > 20) return `AT ${upper.slice(0, 20).trimEnd()}…`;
      return `AT ${upper}`;
    }
    case 'friends':
      return 'AMONG YOUR FRIENDS';
    case 'similar':
      return 'YOUR PEER GROUP';
    case 'top100':
      return 'THE GLOBAL TOP ONE HUNDRED';
  }
}

function rankLabel(peerGroup: PeerGroup): string {
  switch (peerGroup) {
    case 'club':
      return 'CLUB RANK';
    case 'friends':
      return 'FRIENDS RANK';
    case 'similar':
      return 'IN PEER GROUP';
    case 'top100':
      return 'GLOBAL RANK';
  }
}

function selectHandicapEyebrow(args: {
  isLoggedIn: boolean;
  hasHandicap: boolean;
  peerGroup: PeerGroup;
  clubName: string | null;
  improvementSeason: number | null;
  improvement30d: number | null;
  defaultEyebrow: string;
  userTierShort: string | null;
}): string {
  if (!args.isLoggedIn || !args.hasHandicap) return 'ADD YOUR HANDICAP TO ENTER';

  // Priority 1: sharp recent improvement
  if (args.improvement30d !== null && args.improvement30d >= 0.5) {
    return `DOWN ${Math.abs(args.improvement30d).toFixed(1)} IN THIRTY DAYS`;
  }
  // Priority 2: strong season improvement
  if (args.improvementSeason !== null && args.improvementSeason >= 1.0) {
    return `DOWN ${Math.abs(args.improvementSeason).toFixed(1)} THIS SEASON`;
  }
  // Priority 3: peer-group context
  switch (args.peerGroup) {
    case 'club':
      return args.clubName ? `AT ${args.clubName.toUpperCase()}` : 'AT YOUR CLUB';
    case 'friends':
      return 'AMONG YOUR FRIENDS';
    case 'similar':
      return args.userTierShort
        ? `YOUR PEER GROUP · ${args.userTierShort.toUpperCase()} TIER`
        : 'YOUR PEER GROUP';
    case 'top100':
      return 'THE GLOBAL TOP ONE HUNDRED';
  }
  return args.defaultEyebrow;
}

// (TrendArrow removed — per-row trend caption replaced with home club name.
//  The inverted-colour convention documented at the top of this file still
//  applies to the box-score SEASON cell and the trajectory year-on-year value,
//  which compute their colours inline.)


// ── TrajectorySparkline ──────────────────────────────────────────────────
function TrajectorySparkline({
  data,
  width = 320,
  height = 56,
}: {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  // Single-point case — render a centred dot
  if (data.length === 1) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height }}
      >
        <circle cx={width / 2} cy={height / 2} r="3" fill={AMBER} />
      </svg>
    );
  }

  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  // Lower handicap = better → render higher on chart. Invert Y.
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * height;
    return [x, y] as const;
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height }}
    >
      <path
        d={path}
        stroke={AMBER}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={AMBER} />
    </svg>
  );
}

// ── Tier Ladder constants ────────────────────────────────────────────────
const DISPLAY_TIERS: Array<{ id: HandicapTier; abbr: string; shortLabel: string }> = [
  { id: 'elite', abbr: 'ELT', shortLabel: 'Elite' },
  { id: 'scratch', abbr: 'SCR', shortLabel: 'Scratch' },
  { id: 'player', abbr: 'PLR', shortLabel: 'Player' },
  { id: 'single', abbr: 'SF', shortLabel: 'Single' },
  { id: 'midfielder', abbr: 'MID', shortLabel: 'Mid' },
  { id: 'weekend', abbr: 'WKD', shortLabel: 'Weekend' },
];

// ── Props ────────────────────────────────────────────────────────────────
interface LowestHandicapLeaderboardProps {
  peerGroup: PeerGroup;
  onPeerGroupChange: (next: PeerGroup) => void;
  userHomeClubId: string | null;
  userHomeClubName: string | null;
  clubMemberCount: number | null;
  friendsCount: number;
}

export function LowestHandicapLeaderboard({
  peerGroup,
  onPeerGroupChange,
  userHomeClubId,
  userHomeClubName,
  clubMemberCount,
  friendsCount,
}: LowestHandicapLeaderboardProps) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const editRoute = useEditProfileRoute();

  // ── User status (box score, eyebrow, similar window) ───────────────────
  const { data: userStatus } = useUserHandicapStatus({ userId: user?.id, enabled: !!user?.id });
  const userHandicap = userStatus?.current_handicap ?? null;
  const userTier = userHandicap !== null ? getHandicapTier(userHandicap) : null;
  // Roll Hacker into Weekend for ladder display
  const displayTierId: HandicapTier = userTier === 'hacker' ? 'weekend' : (userTier ?? 'weekend');

  // ── Editorial copy ─────────────────────────────────────────────────────
  const { data: editorial, isPending: editorialPending } = useDailyEditorial({
    surface: 'handicap',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // ── Trajectory ─────────────────────────────────────────────────────────
  const { data: trajectory } = useUserHandicapTrajectory({ userId: user?.id, enabled: !!user?.id });

  // ── Standings data ─────────────────────────────────────────────────────
  // Map peer group → underlying scope for useLowestHandicapLeaderboard
  const lowestScope: 'global' | 'friends' | 'club' | 'country' | null = useMemo(() => {
    if (peerGroup === 'top100') return 'global';
    if (peerGroup === 'friends') return 'friends';
    if (peerGroup === 'club') return 'club';
    return null; // 'similar' uses the dedicated RPC
  }, [peerGroup]);

  const lowestQuery = useLowestHandicapLeaderboard({
    scope: lowestScope ?? 'global',
    clubId: peerGroup === 'club' ? userHomeClubId : undefined,
    enabled: lowestScope !== null && (peerGroup !== 'club' || !!userHomeClubId),
  });

  const similarQuery = useSimilarHandicapLeaderboard({
    userHandicap,
    windowSize: 3,
    enabled: peerGroup === 'similar',
  });

  const allEntries: LowestHandicapEntry[] = useMemo(() => {
    if (peerGroup === 'similar') return similarQuery.data ?? [];
    return lowestQuery.data?.pages.flatMap((p) => p.entries) ?? [];
  }, [peerGroup, similarQuery.data, lowestQuery.data]);

  // For top100, cap to 100 rows
  const displayEntries = useMemo(() => {
    if (peerGroup === 'top100') return allEntries.slice(0, 100);
    return allEntries;
  }, [peerGroup, allEntries]);

  // ── User rank in current peer group ────────────────────────────────────
  // For top100, fall back to the user's true global rank when they sit
  // outside the first 100 returned rows. For other scopes, absence from
  // the returned list genuinely means "not in this peer group".
  const meEntry = displayEntries.find((e) => e.user_id === user?.id);
  const peerRank =
    meEntry?.rank ??
    (peerGroup === 'top100' ? userStatus?.handicap_rank ?? null : null);

  // ── Personalised eyebrow ───────────────────────────────────────────────
  const personalisedEyebrow = useMemo(() => {
    return selectHandicapEyebrow({
      isLoggedIn: !!user,
      hasHandicap: userHandicap !== null,
      peerGroup,
      clubName: userHomeClubName,
      improvementSeason: userStatus?.improvement_season ?? null,
      improvement30d: userStatus?.improvement_30d ?? null,
      defaultEyebrow: editorial?.eyebrow ?? 'THE HANDICAP RECORD',
      userTierShort: userTier ? getTierShortName(userTier) : null,
    });
  }, [user, userHandicap, peerGroup, userHomeClubName, userStatus, editorial, userTier]);

  // ── Box score season trend ─────────────────────────────────────────────
  const seasonImprovement = userStatus?.improvement_season ?? 0;
  const seasonHasData = userStatus?.improvement_season !== null && userStatus?.improvement_season !== undefined;
  // improvement_season > 0 means handicap dropped → improving (green ↓)
  // improvement_season < 0 means handicap rose → drifting (crimson ↑)
  const seasonColour =
    !seasonHasData
      ? INK_FAINT
      : seasonImprovement === 0
      ? INK_FAINT
      : seasonImprovement > 0
      ? SUCCESS
      : CRIMSON;
  const seasonArrow = !seasonHasData || seasonImprovement === 0 ? '—' : seasonImprovement > 0 ? '↓' : '↑';

  // ── Trajectory derived stats ───────────────────────────────────────────
  const trajectoryPoints = trajectory?.points ?? [];
  const yoyImprovement = trajectory?.yoy_improvement ?? 0;
  const bestHcp = trajectory?.best ?? null;
  const worstHcp = trajectory?.worst ?? null;
  const showTrajectory =
    !!trajectory && trajectoryPoints.length >= 2 && userHandicap !== null;

  // ── Infinite scroll for top100 ─────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  isFetchingRef.current = lowestQuery.isFetchingNextPage;

  useEffect(() => {
    if (peerGroup !== 'top100') return;
    if (!sentinelRef.current || !lowestQuery.hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && lowestQuery.hasNextPage && !isFetchingRef.current) {
          lowestQuery.fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [peerGroup, lowestQuery.hasNextPage, lowestQuery.fetchNextPage]);

  // ── Closest rival ahead (for chase panel P2) ───────────────────────────
  const closestRivalAhead = useMemo(() => {
    if (!user || !displayEntries.length) return null;
    const userIdx = displayEntries.findIndex((e) => e.is_current_user);
    if (userIdx <= 0) return null;
    const rival = displayEntries[userIdx - 1];
    const me = displayEntries[userIdx];
    if (!rival || !me) return null;
    const gap = me.handicap_index - rival.handicap_index;
    if (gap <= 0) return null;
    return {
      name: rival.display_name || rival.username || 'A rival',
      gap,
    };
  }, [user, displayEntries]);

  const chaseStatements = useMemo<HandicapChaseStatement[]>(() => {
    if (!user) return [];
    if (peerGroup !== 'top100') return [];
    if (userHandicap === null || userTier === null) return [];
    return buildHandicapChaseStatements({
      userHandicap,
      userTier,
      trajectoryBest: trajectory?.best ?? null,
      yoyImprovement: trajectory?.yoy_improvement ?? null,
      closestRivalAhead,
    });
  }, [user, peerGroup, userHandicap, userTier, trajectory?.best, trajectory?.yoy_improvement, closestRivalAhead]);

  // ── Jump-to-position pill (top100 only) ────────────────────────────────
  const [userRowOffscreen, setUserRowOffscreen] = useState(false);
  const [userRowDirection, setUserRowDirection] = useState<'above' | 'below'>('below');

  useEffect(() => {
    if (peerGroup !== 'top100') {
      setUserRowOffscreen(false);
      return;
    }
    const el = document.querySelector('[data-handicap-user-row="self"]') as HTMLElement | null;
    if (!el) {
      setUserRowOffscreen(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setUserRowOffscreen(false);
        } else {
          setUserRowOffscreen(true);
          const rect = entry.boundingClientRect;
          setUserRowDirection(rect.top < 0 ? 'above' : 'below');
        }
      },
      { threshold: 0, rootMargin: '0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [peerGroup, displayEntries.length]);

  const handleJumpToUser = useCallback(() => {
    const el = document.querySelector('[data-handicap-user-row="self"]') as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Row click handler ──────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (userId: string) => {
      navigate(getProfilePathById(userId));
    },
    [navigate],
  );

  // ── Loading state (initial) ────────────────────────────────────────────
  const isInitialLoading =
    (peerGroup === 'similar' ? similarQuery.isLoading : lowestQuery.isLoading) &&
    displayEntries.length === 0;

  // ── Section label ──────────────────────────────────────────────────────
  const sectionLabel = useMemo(() => {
    if (peerGroup === 'club') {
      const clubLabel = userHomeClubName?.toUpperCase() ?? 'YOUR CLUB';
      const count = clubMemberCount ?? displayEntries.length;
      return `${clubLabel} · ${count} MEMBERS`;
    }
    if (peerGroup === 'friends') return `FRIENDS · ${friendsCount || displayEntries.length} MEMBERS`;
    if (peerGroup === 'similar') return 'PLAYERS NEAR YOUR INDEX';
    return 'THE GLOBAL TOP ONE HUNDRED';
  }, [peerGroup, userHomeClubName, clubMemberCount, friendsCount, displayEntries.length]);

  // ── Peer group toggle config ───────────────────────────────────────────
  const toggleOpts: Array<{ key: PeerGroup; label: string; available: boolean }> = [
    { key: 'club', label: 'My Club', available: !!userHomeClubId },
    { key: 'friends', label: 'Friends', available: true },
    { key: 'similar', label: 'Similar (±3)', available: userHandicap !== null },
    { key: 'top100', label: 'Top 100', available: true },
  ];

  return (
    <div style={{ background: BG, minHeight: '100%', fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* ── MASTHEAD ── */}
      <div
        style={{
          padding: '20px 20px 14px',
          borderBottom: `3px double ${INK}`,
          textAlign: 'center',
          background: BG,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            color: CRIMSON,
            letterSpacing: '0.18em',
            marginBottom: 12,
            minHeight: 14,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: CRIMSON, display: 'inline-block' }} />
          <span>{getMastheadSubtitle(peerGroup, userHomeClubName)}</span>
        </div>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: '-0.035em',
            margin: 0,
            lineHeight: 0.95,
            color: INK,
          }}
        >
          The Handicap Record
        </h1>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.32em',
            color: INK_MUTED,
            marginTop: 6,
          }}
        >
          INDEX · TIER · TRAJECTORY
        </div>
      </div>

      {/* ── PEER GROUP TOGGLE ── */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 5 }}>
        {toggleOpts.map((opt) => {
          const isActive = peerGroup === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => opt.available && onPeerGroupChange(opt.key)}
              disabled={!opt.available}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 8,
                background: isActive ? INK : 'transparent',
                color: isActive ? '#fff' : opt.available ? INK_MUTED : HAIRLINE,
                border: isActive ? 'none' : '1px solid rgba(15,23,42,0.15)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.03em',
                cursor: opt.available ? 'pointer' : 'not-allowed',
                opacity: opt.available ? 1 : 0.5,
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── FRONT-PAGE LEDE ── */}
      {editorialPending ? (
        <EditorialLedeSkeleton />
      ) : (
        <div style={{ padding: '22px 20px 0', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.28em',
              color: CRIMSON,
              marginBottom: 10,
            }}
          >
            {personalisedEyebrow}
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.05,
              color: INK,
            }}
          >
            {editorial?.headline ?? 'Index · Tier'}
            {editorial?.headlineTwo && (
              <>
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 900, color: INK_BODY }}>
                  {editorial.headlineTwo}
                </span>
              </>
            )}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: INK_MUTED,
              lineHeight: 1.55,
              marginTop: 12,
              marginBottom: 0,
              fontStyle: 'italic',
            }}
          >
            {editorial?.standfirst ??
              'The clbhouz handicap board tracks every member who plays off a verified index. Rate more courses to refine yours.'}
          </p>
        </div>
      )}

      {/* ── BOX SCORE ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div
          style={{
            borderTop: `1px solid ${INK}`,
            borderBottom: `1px solid ${INK}`,
            padding: '16px 0',
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
            alignItems: 'center',
          }}
        >
          {/* INDEX */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: INK_FAINT,
                letterSpacing: '0.18em',
                marginBottom: 4,
              }}
            >
              YOUR INDEX
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: userHandicap !== null ? CRIMSON : INK_FAINT,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {userHandicap !== null ? formatHcp(userHandicap) : '—'}
            </div>
          </div>
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />

          {/* RANK */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: INK_FAINT,
                letterSpacing: '0.18em',
                marginBottom: 4,
              }}
            >
              {rankLabel(peerGroup)}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: peerRank !== null ? CRIMSON : INK_FAINT,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {peerRank !== null ? `#${peerRank}` : '—'}
            </div>
          </div>
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />

          {/* SEASON */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: INK_FAINT,
                letterSpacing: '0.18em',
                marginBottom: 4,
              }}
            >
              SEASON
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: seasonColour,
                fontVariantNumeric: 'tabular-nums lining-nums',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {!seasonHasData
                ? '—'
                : seasonImprovement === 0
                ? '0.0'
                : `${seasonArrow}${Math.abs(seasonImprovement).toFixed(1)}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5.5 ON THE CHASE PANEL — top100 logged-in with handicap ── */}
      {chaseStatements.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              borderTop: `3px double ${INK}`,
              borderBottom: `3px double ${INK}`,
              padding: '16px 4px',
              background: '#fff',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: BG,
                padding: '0 10px',
                fontSize: 9,
                fontWeight: 800,
                color: CRIMSON,
                letterSpacing: '0.28em',
              }}
            >
              ON THE CHASE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {chaseStatements.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    padding: '4px 12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: INK_FAINT,
                      letterSpacing: '0.18em',
                      minWidth: 14,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 600,
                      color:
                        s.emphasis === 'positive'
                          ? '#15803D'
                          : s.emphasis === 'negative'
                          ? CRIMSON
                          : INK,
                      letterSpacing: '-0.005em',
                      lineHeight: 1.4,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {s.text}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: INK_FAINT,
                letterSpacing: '0.12em',
                fontStyle: 'italic',
              }}
            >
              Based on your global standings · Updated daily
            </div>
          </div>
        </div>
      )}

      {/* ── TRAJECTORY CARD ── */}
      {showTrajectory && (
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              background: DARK,
              color: '#fff',
              borderRadius: 4,
              overflow: 'hidden',
              padding: '16px 18px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle at top right, rgba(247,147,30,0.15), transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 14,
                position: 'relative',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.22em',
                    marginBottom: 4,
                  }}
                >
                  YOUR TRAJECTORY
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                  }}
                >
                  Twelve-month view
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.22em',
                    marginBottom: 4,
                  }}
                >
                  YEAR-ON-YEAR
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color:
                      yoyImprovement > 0 ? SUCCESS : yoyImprovement < 0 ? CRIMSON : '#fff',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {yoyImprovement === 0
                    ? '—'
                    : `${yoyImprovement > 0 ? '↓' : '↑'}${Math.abs(yoyImprovement).toFixed(1)}`}
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <div style={{ marginBottom: 12 }}>
              {/* viewBox is the coordinate space; preserveAspectRatio="none" + width:100%
                  stretches to the container; vectorEffect="non-scaling-stroke" keeps the
                  1.5px line weight constant regardless of stretch. */}
              <TrajectorySparkline data={trajectoryPoints} width={320} height={56} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.04em',
                  marginTop: 4,
                }}
              >
                <span>{trajectoryPoints[0]?.label ?? ''}</span>
                <span>{trajectoryPoints[Math.floor(trajectoryPoints.length / 2)]?.label ?? ''}</span>
                <span>{trajectoryPoints[trajectoryPoints.length - 1]?.label ?? ''}</span>
              </div>
            </div>

            {/* Best / Now / Worst */}
            <div
              style={{
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                display: 'grid',
                gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
                alignItems: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.22em',
                    marginBottom: 2,
                  }}
                >
                  BEST
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: AMBER,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {bestHcp !== null ? formatHcp(bestHcp) : '—'}
                </div>
              </div>
              <div style={{ height: 20, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.22em',
                    marginBottom: 2,
                  }}
                >
                  NOW
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {userHandicap !== null ? formatHcp(userHandicap) : '—'}
                </div>
              </div>
              <div style={{ height: 20, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.22em',
                    marginBottom: 2,
                  }}
                >
                  WORST
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {worstHcp !== null ? formatHcp(worstHcp) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TIER LADDER — threshold ranges + connector hairline ── */}
      <div style={{ padding: '22px 20px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          <div style={{ width: 12, height: 1, background: INK }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK,
              letterSpacing: '0.22em',
            }}
          >
            TIER LADDER
          </span>
          <div style={{ width: 12, height: 1, background: INK }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Connector hairline through tier name row centre */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 28,
            right: 28,
            top: 'calc(22px + 22px + 14px)',
            height: 1,
            background: 'rgba(15,23,42,0.10)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6,1fr)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {DISPLAY_TIERS.map((t, i) => {
            const isCurrent = userTier !== null && t.id === displayTierId;
            const sharperThanYou = userTier !== null && isTierSharper(t.id, displayTierId);
            const labelColor = isCurrent ? INK : sharperThanYou ? INK_MUTED : HAIRLINE;
            const rangeColor = isCurrent ? INK_FAINT : HAIRLINE;
            return (
              <div
                key={t.id}
                style={{
                  padding: '10px 2px 6px',
                  textAlign: 'center',
                  background: isCurrent ? 'rgba(159,29,29,0.04)' : 'transparent',
                  borderRight:
                    i < DISPLAY_TIERS.length - 1 ? '1px solid rgba(15,23,42,0.08)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div style={{ height: 6, marginBottom: 4 }}>
                  {isCurrent && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: CRIMSON,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: labelColor,
                    letterSpacing: '-0.005em',
                    background: BG,
                    padding: '0 4px',
                  }}
                >
                  {getTierShortName(t.id)}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: rangeColor,
                    letterSpacing: '0.04em',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {getTierThresholdRange(t.id)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FULL STANDINGS ── */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
          <div style={{ width: 12, height: 1, background: INK }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK,
              letterSpacing: '0.22em',
            }}
          >
            {sectionLabel}
          </span>
          <div style={{ width: 12, height: 1, background: INK }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Empty: club without home club */}
        {peerGroup === 'club' && !userHomeClubId && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p
              style={{
                fontSize: 15,
                color: INK_FAINT,
                fontStyle: 'italic',
                marginBottom: 14,
              }}
            >
              Set a home club to see your club board.
            </p>
            <button
              onClick={() => navigate(editRoute)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                color: CRIMSON,
                letterSpacing: '0.18em',
                fontFamily: 'inherit',
              }}
            >
              EDIT PROFILE →
            </button>
          </div>
        )}

        {/* Empty: friends with none */}
        {peerGroup === 'friends' && !isInitialLoading && displayEntries.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p
              style={{
                fontSize: 15,
                color: INK_FAINT,
                fontStyle: 'italic',
                marginBottom: 14,
              }}
            >
              No friends on clbhouz with handicaps yet.
            </p>
            <button
              onClick={() => navigate('/find-friends')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                color: CRIMSON,
                letterSpacing: '0.18em',
                fontFamily: 'inherit',
              }}
            >
              FIND FRIENDS →
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isInitialLoading && (
          <div style={{ marginTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 38px 1fr 56px 64px',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(15,23,42,0.07)',
                }}
              >
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-7 w-7 rounded" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12 ml-auto" />
                <Skeleton className="h-5 w-10 ml-auto" />
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {displayEntries.length > 0 && (
          <>
            {/* Column headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 38px 1fr 56px 64px',
                padding: '10px 0 8px',
                borderBottom: `1px solid ${INK}`,
                fontSize: 9,
                fontWeight: 800,
                color: INK_FAINT,
                letterSpacing: '0.18em',
                alignItems: 'center',
              }}
            >
              <span>POS</span>
              <span />
              <span>PLAYER</span>
              <span style={{ textAlign: 'right' }}>TIER</span>
              <span style={{ textAlign: 'right' }}>HCP</span>
            </div>

            {displayEntries.map((p, i) => {
              const isLast = i === displayEntries.length - 1;
              const isYou = p.user_id === user?.id;
              const rawTier = getHandicapTier(p.handicap_index);
              // Hacker rolls into Weekend per brief — never render "HKR" or "Happy Hacker".
              const tier: HandicapTier = rawTier === 'hacker' ? 'weekend' : rawTier;

              return (
                <div
                  key={p.user_id}
                  data-handicap-user-row={isYou ? 'self' : undefined}
                  onClick={() => handleRowClick(p.user_id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 38px 1fr 56px 64px',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: isLast
                      ? `1px solid ${INK}`
                      : '1px solid rgba(15,23,42,0.07)',
                    background: isYou ? 'rgba(159,29,29,0.04)' : 'transparent',
                    marginLeft: isYou ? -10 : 0,
                    marginRight: isYou ? -10 : 0,
                    paddingLeft: isYou ? 10 : 0,
                    paddingRight: isYou ? 10 : 0,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  {isYou && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: CRIMSON,
                      }}
                    />
                  )}

                  {/* POS */}
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: p.rank <= 3 ? INK : INK_FAINT,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {p.rank}
                  </span>

                  {/* Avatar */}
                  <div
                    style={{
                      width: 30,
                      aspectRatio: '1 / 1.05',
                      borderRadius: '34%',
                      overflow: 'hidden',
                      border: isYou
                        ? '0.5px solid #9F1D1D'
                        : '0.5px solid rgba(15,23,42,0.18)',
                      background: '#fff',
                    }}
                  >
                    <SquircleAvatar
                      src={p.avatar_url}
                      alt={p.display_name ?? p.username ?? ''}
                      userId={p.user_id}
                      size={30}
                      hideRing
                    />
                  </div>

                  {/* Name + home club */}
                  <div style={{ minWidth: 0, paddingLeft: 4 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: INK,
                        letterSpacing: '-0.005em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.display_name || p.username || 'Unknown'}
                      {isYou && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: CRIMSON,
                            letterSpacing: '0.18em',
                            marginLeft: 6,
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    {(() => {
                      const isUserClub =
                        !!userHomeClubName &&
                        !!p.home_club &&
                        p.home_club === userHomeClubName &&
                        !isYou;
                      return (
                        <div
                          style={{
                            fontSize: 11,
                            color: isUserClub ? HAIRLINE : INK_FAINT,
                            marginTop: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.home_club || 'Independent'}
                        </div>
                      );
                    })()}
                  </div>

                  {/* TIER */}
                  <span
                    style={{
                      textAlign: 'right',
                      fontSize: 9,
                      fontWeight: 800,
                      color: INK_MUTED,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {getTierAbbr(tier)}
                  </span>

                  {/* HCP */}
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      textAlign: 'right',
                      color: INK,
                      letterSpacing: '-0.03em',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {formatHcp(p.handicap_index)}
                  </span>
                </div>
              );
            })}

            {/* Sentinel for top100 infinite scroll */}
            {peerGroup === 'top100' && lowestQuery.hasNextPage && (
              <div ref={sentinelRef} style={{ height: 40 }} />
            )}
          </>
        )}
      </div>

      {/* ── FOOTER CAPTION ── */}
      <div style={{ padding: '20px 20px 28px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 10,
            color: INK_FAINT,
            letterSpacing: '0.06em',
            fontStyle: 'italic',
          }}
        >
          {peerGroup === 'similar'
            ? 'Centred on your index · Showing three above and three below'
            : 'Ranked by handicap index · Lowest first · Updated daily'}
        </div>
      </div>
    </div>
  );
}
