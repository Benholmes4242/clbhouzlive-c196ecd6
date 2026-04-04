/**
 * CollegeRankingsPreview — Franchise Rankings (Phase 1 redesign)
 *
 * Podium layout: #1 centre (tallest), #2 left, #3 right.
 * Leaderboard rows (4–8), Franchise Leaders carousel, chase metric, squad captains.
 */

import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, GraduationCap } from 'lucide-react';
import { SectionErrorState } from '../SectionErrorState';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useFranchiseCaptains, type FranchiseCaptain } from '../../hooks/useFranchiseCaptains';
import { useFollowedColleges } from '../../hooks/useCollegeMovers';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PickFranchiseSheet } from '../college/PickFranchiseSheet';
import {
  getCollegePodiumTint,
} from '../../config/collegeBrandColors';

// No.1-rank and "Your Franchise" accent colour
const FRANCHISE_AMBER = '#D97706';

// ============================================================================
// HELPERS
// ============================================================================
function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

// ============================================================================
// FRANCHISE LEADER CATEGORIES
// ============================================================================
interface LeaderCategory {
  key: keyof CollegeSeasonStats;
  title: string;
  sort: 'asc' | 'desc';
  format: (v: number) => string;
}

const LEADER_CATEGORIES: LeaderCategory[] = [
  { key: 'avg_driving_distance', title: 'Longest Drivers', sort: 'desc', format: (v) => `${Number(v).toFixed(1)} yds` },
  { key: 'avg_driving_accuracy', title: 'Fairways Hit', sort: 'desc', format: (v) => `${Math.round(Number(v))}%` },
  { key: 'avg_gir', title: 'Greens in Reg', sort: 'desc', format: (v) => `${Math.round(Number(v))}%` },
  { key: 'avg_putting', title: 'Average Putts', sort: 'asc', format: (v) => `${Number(v).toFixed(2)}` },
  { key: 'avg_scrambling', title: 'Best Scramblers', sort: 'desc', format: (v) => `${Math.round(Number(v))}%` },
  { key: 'avg_sand_saves', title: 'Sand Saves', sort: 'desc', format: (v) => `${Math.round(Number(v))}%` },
  { key: 'avg_sg_total', title: 'Strokes Gained', sort: 'desc', format: (v) => {
    const n = Number(v);
    return (n >= 0 ? '+' : '') + n.toFixed(2);
  }},
  { key: 'avg_scoring', title: 'Lowest Avg Scoring', sort: 'asc', format: (v) => `${Number(v).toFixed(1)}` },
];

// ============================================================================
// SKELETON
// ============================================================================
function CollegePreviewSkeleton() {
  return (
    <section aria-label="College Franchise Rankings">
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="mx-4 h-72 rounded-2xl bg-muted animate-pulse" />
    </section>
  );
}

// ============================================================================
// CHASE METRIC
// ============================================================================
function generateChaseMetric(colleges: CollegeSeasonStats[], mediaMap: Map<string, CollegeMedia> | undefined): string {
  if (colleges.length < 2) return '';
  const first = colleges[0];
  const second = colleges[1];
  const gap = first.earnings_total - second.earnings_total;
  const formattedGap = formatCurrency(gap);

  const firstName = mediaMap?.get(first.normalized_name)?.college_name || first.normalized_name;
  const secondName = mediaMap?.get(second.normalized_name)?.college_name || second.normalized_name;

  if (gap < 500_000) {
    return `${secondName} is just ${formattedGap} behind ${firstName} — this could flip any week`;
  } else if (gap < 2_000_000) {
    return `${secondName} is closing in on ${firstName} — only ${formattedGap} separates them`;
  }
  return `${firstName} leads by ${formattedGap} — but ${secondName} is chasing hard`;
}

// ============================================================================
// PODIUM CARD
// ============================================================================
function PodiumCard({
  stats, media, rank, captain, isUserFranchise = false,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  rank: 1 | 2 | 3;
  captain: FranchiseCaptain | undefined;
  isUserFranchise?: boolean;
}) {
  const navigate = useNavigate();
  const isFirst = rank === 1;
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;
  const captainPhotoUrl = captain
    ? getPlayerHeadshotUrl(captain.fullName, (captain as any).tourCodes?.[0] ?? (captain as any).tourCode ?? 'pga')
    : null;
  const logoUrl = getCollegeLogoUrl(media?.college_name || stats.normalized_name);

  return (
    <button
      onClick={() => navigate(`/tourhub/college-golf/${stats.normalized_name}`)}
      className="flex flex-col text-left overflow-hidden active:scale-[0.97] transition-transform"
      style={{
        flex: isFirst ? '1 1 45%' : '1 1 27.5%',
        background: getCollegePodiumTint(stats.normalized_name) || 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.5)',
        borderRadius: '16px',
        minHeight: isFirst ? '240px' : '200px',
        alignSelf: 'flex-end',
      }}
    >
      <div
        className="flex-1 flex flex-col items-center justify-center text-center"
        style={{ padding: isFirst ? '20px 12px 0' : '14px 8px 0' }}
      >
        {isUserFranchise && (
          <div className="mb-1">
            <YourFranchiseBadge />
          </div>
        )}
        <div className="flex items-center mb-2" style={{ gap: '4px' }}>
          <span
            style={{
              fontSize: isFirst ? '11px' : '10px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase' as const,
              color: 'hsl(var(--muted-foreground) / 0.6)',
            }}
          >
            #{rank}
          </span>
        </div>

        {logoUrl && (
          <img
            src={logoUrl}
            alt={displayName}
            className="object-contain mb-2"
            style={{
              width: isFirst ? '80px' : '50px',
              height: isFirst ? '80px' : '50px',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        <h3
          className="text-foreground leading-tight m-0 mb-1"
          style={{
            fontSize: isFirst ? '20px' : '14px',
            fontWeight: isFirst ? 700 : 600,
            letterSpacing: '-0.3px',
          }}
        >
          {displayName}
        </h3>

        <p
          className="m-0 text-foreground"
          style={{
            fontSize: isFirst ? '16px' : '13px',
            fontWeight: 700,
          }}
        >
          {formatCurrency(stats.earnings_total)}
        </p>

        <p
          className="m-0"
          style={{
            fontSize: isFirst ? '12px' : '11px',
            color: 'hsl(var(--muted-foreground))',
            marginTop: '4px',
          }}
        >
          {stats.wins_total} {stats.wins_total === 1 ? 'win' : 'wins'} · {stats.player_count} on tour
        </p>
      </div>

      {captain && (
        <div
          style={{
            borderTop: '1px solid hsl(var(--border) / 0.3)',
            padding: isFirst ? '10px 12px' : '8px 8px',
            marginTop: 'auto',
          }}
        >
          <p
            className="m-0"
            style={{
              fontSize: isFirst ? '10px' : '9px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase' as const,
              color: 'hsl(var(--muted-foreground) / 0.6)',
              marginBottom: isFirst ? '6px' : '4px',
              textAlign: 'center' as const,
            }}
          >
            {isFirst ? 'Squad Captain' : 'Captain'}
          </p>
          <div className="flex flex-col items-center" style={{ gap: '6px' }}>
            <SquircleAvatar
              size={isFirst ? 28 : 22}
              src={captainPhotoUrl || PLAYER_SILHOUETTE_URL}
              alt={captain.fullName}
              hideRing
              fallback={captain.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            />
            <div className="text-center">
              <p
                className="m-0 text-foreground truncate"
                style={{
                  fontSize: isFirst ? '12px' : '10px',
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {isFirst ? captain.fullName : abbreviateName(captain.fullName)}
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: isFirst ? '11px' : '10px',
                  fontWeight: 600,
                  color: 'hsl(var(--muted-foreground) / 0.6)',
                }}
              >
                {formatCurrency(captain.earnings)}
              </p>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

// ============================================================================
// LEADERBOARD ROWS (4th–8th) — flat on page background
// ============================================================================
function LeaderboardRows({
  rows,
  mediaMap,
  userFranchiseName,
}: {
  rows: CollegeSeasonStats[];
  mediaMap: Map<string, CollegeMedia> | undefined;
  userFranchiseName?: string;
}) {
  const navigate = useNavigate();
  if (!rows.length) return null;

  return (
    <div className="mx-4 mb-6">
      {/* Header row */}
      <div
        className="flex items-center"
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        <span style={{ width: '30px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground) / 0.6)' }}>#</span>
        <span className="flex-1" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground) / 0.6)' }}>Franchise</span>
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground) / 0.6)', textAlign: 'right' as const }}>Earnings on Tour</span>
      </div>

      {rows.map((stats, i) => {
        const media = mediaMap?.get(stats.normalized_name);
        const displayName = media?.short_name || media?.college_name || stats.normalized_name;
        const rank = i + 4;
        const logoUrl = getCollegeLogoUrl(media?.college_name || stats.normalized_name);

        return (
          <button
            key={stats.id}
            onClick={() => navigate(`/tourhub/college-golf/${stats.normalized_name}`)}
            className="w-full flex items-center bg-transparent active:bg-muted/30 transition-colors"
            style={{
              padding: '14px 16px',
              borderBottom: i < rows.length - 1 ? '1px solid hsl(var(--border) / 0.15)' : 'none',
            }}
          >
            <span style={{ width: '30px', fontSize: '14px', fontWeight: 600, color: 'hsl(var(--muted-foreground) / 0.6)' }}>{rank}</span>
            <div className="flex items-center flex-1 min-w-0" style={{ gap: '8px' }}>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="object-contain rounded-full"
                  style={{ width: '24px', height: '24px' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span className="truncate text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>{displayName}</span>
              {userFranchiseName === stats.normalized_name && (
                <YourFranchiseBadge />
              )}
            </div>
            <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 600, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(stats.earnings_total)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// FRANCHISE LEADERS CAROUSEL
// ============================================================================
interface FranchiseLeader {
  title: string;
  college: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  value: string;
  alumni: number;
}

function useFranchiseLeaders(
  allStats: CollegeSeasonStats[] | undefined,
  mediaMap: Map<string, CollegeMedia> | undefined,
): FranchiseLeader[] {
  return useMemo(() => {
    if (!allStats?.length) return [];
    const eligible = allStats.filter(c => c.player_count >= 2);

    return LEADER_CATEGORIES.map(cat => {
      const sorted = [...eligible]
        .filter(c => (c[cat.key] as number | null) != null)
        .sort((a, b) =>
          cat.sort === 'desc'
            ? (b[cat.key] as number) - (a[cat.key] as number)
            : (a[cat.key] as number) - (b[cat.key] as number)
        );

      const leader = sorted[0];
      if (!leader) return null;

      return {
        title: cat.title,
        college: leader,
        media: mediaMap?.get(leader.normalized_name),
        value: cat.format(leader[cat.key] as number),
        alumni: leader.player_count,
      };
    }).filter(Boolean) as FranchiseLeader[];
  }, [allStats, mediaMap]);
}

function FranchiseLeadersCarousel({ leaders }: { leaders: FranchiseLeader[] }) {
  if (!leaders.length) return null;

  return (
    <div className="mb-6">
      {/* Section heading */}
      <div className="px-4 mb-3">
        <h3 className="m-0 text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          Franchise Leaders
        </h3>
        <p className="m-0" style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--muted-foreground) / 0.6)', marginTop: '3px' }}>
          Which franchise leads each category?
        </p>
      </div>

      {/* Scroll container */}
      <div
        className="flex overflow-x-auto scrollbar-hide"
        role="list"
        aria-label="Franchise statistical leaders by category"
        style={{
          gap: '10px',
          paddingLeft: '16px',
          paddingRight: '16px',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
        }}
      >
        {leaders.map((leader) => {
          const logoUrl = getCollegeLogoUrl(leader.media?.college_name || leader.college.normalized_name);

          return (
            <Link
              key={leader.title}
              to={`/tourhub/college-golf/${leader.college.normalized_name}`}
              className="flex-shrink-0 flex flex-col items-center text-center active:scale-[0.97] transition-transform no-underline"
              style={{
                width: '160px',
                minHeight: '140px',
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: '16px',
                padding: '14px',
              }}
              aria-label={`${leader.title} leader: ${leader.media?.short_name || leader.college.normalized_name}`}
              role="listitem"
            >
              {/* Category title */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  color: 'hsl(var(--muted-foreground) / 0.6)',
                  textTransform: 'uppercase' as const,
                  marginBottom: '12px',
                }}
              >
                {leader.title}
              </span>

              {/* Logo */}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={leader.media?.college_name || ''}
                  className="object-contain mb-2"
                  style={{ width: '36px', height: '36px' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}

              {/* College name */}
              <span className="text-foreground" style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2, marginBottom: '2px' }}>
                {leader.media?.short_name || leader.media?.college_name || leader.college.normalized_name}
              </span>

              {/* Stat value */}
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '2px', fontVariantNumeric: 'tabular-nums' }}>
                {leader.value}
              </span>

              {/* Alumni count */}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                {leader.alumni} on tour
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PICK YOUR FRANCHISE CTA
// ============================================================================
function PickFranchiseCTA({ onOpen }: { onOpen: () => void }) {
  const { user } = useSupabaseSession();
  const { data: followed } = useFollowedColleges(user?.id);

  const hasFollowed = (followed?.length ?? 0) > 0;

  if (!user || hasFollowed) return null;

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center text-left active:scale-[0.97] transition-transform"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.5)',
        borderRadius: '16px',
        padding: '16px',
        gap: '12px',
      }}
    >
      <GraduationCap className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--accent-amber))' }} />
      <div className="flex-1 min-w-0">
        <p className="m-0 text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>
          Pick your franchise
        </p>
        <p className="m-0" style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground) / 0.6)' }}>
          Follow a college and join the rivalry
        </p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground opacity-60 flex-shrink-0" />
    </button>
  );
}

// ============================================================================
// YOUR FRANCHISE BADGE (shown on podium/leaderboard if user follows)
// ============================================================================
function YourFranchiseBadge() {
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.8px',
        textTransform: 'uppercase' as const,
        background: 'rgba(245,158,11,0.15)',
        color: FRANCHISE_AMBER,
        borderRadius: '4px',
        padding: '2px 6px',
        lineHeight: 1,
      }}
    >
      Your Franchise
    </span>
  );
}

// ============================================================================
// YOUR FRANCHISE COMPACT CARD (outside top 8)
// ============================================================================
function YourFranchiseCard({
  stats,
  media,
  rank,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  rank: number;
}) {
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(media?.college_name || stats.normalized_name);

  return (
    <div
      className="mx-4 mb-6"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.5)',
        borderRadius: '16px',
        padding: '14px 16px',
      }}
    >
      <span
        style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.8px',
          textTransform: 'uppercase' as const,
          color: FRANCHISE_AMBER,
          marginBottom: '8px',
          display: 'block',
        }}
      >
        Your Franchise
      </span>
      <div className="flex items-center" style={{ gap: '10px' }}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt={displayName}
            className="object-contain rounded-full"
            style={{ width: '28px', height: '28px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-foreground truncate block" style={{ fontSize: '15px', fontWeight: 600 }}>
            {displayName}
          </span>
          <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground) / 0.6)' }}>
            {formatCurrency(stats.earnings_total)} earnings · {stats.player_count} pros on tour
          </span>
        </div>
        <span className="text-muted-foreground" style={{ fontSize: '18px', fontWeight: 700 }}>
          #{rank}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function CollegeRankingsPreview() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: allStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading, error: mediaError, refetch: refetchMedia } = useCollegeMediaMap();
  const { data: followed } = useFollowedColleges(user?.id);
  const { data: profile } = useUserProfile(user?.id);

  // Sort by earnings → top 8
  const top8 = useMemo(() => {
    if (!allStats?.length) return [];
    return [...allStats].sort((a, b) => b.earnings_total - a.earnings_total).slice(0, 8);
  }, [allStats]);

  const podium = top8.slice(0, 3);
  const leaderboardRows = top8.slice(3, 8);

  const topCollegeSlugs = useMemo(() => podium.map(s => s.normalized_name), [podium]);

  // Squad captains for top 3
  const { data: captainMap } = useFranchiseCaptains(topCollegeSlugs);

  // Chase metric
  const chaseMetric = useMemo(() => generateChaseMetric(podium, collegeMap), [podium, collegeMap]);

  // Franchise leaders
  const franchiseLeaders = useFranchiseLeaders(allStats, collegeMap);

  // User's followed franchise (highest-ranked)
  const userFranchise = useMemo(() => {
    if (!followed?.length || !allStats?.length) return null;
    const attendedCollege = (profile as any)?.college_normalized;
    const followedNames = followed.map(f => f.normalized_name);
    if (attendedCollege && !followedNames.includes(attendedCollege)) {
      followedNames.push(attendedCollege);
    }

    const sorted = [...allStats].sort((a, b) => b.earnings_total - a.earnings_total);
    for (let i = 0; i < sorted.length; i++) {
      if (followedNames.includes(sorted[i].normalized_name)) {
        return { stats: sorted[i], rank: i + 1 };
      }
    }
    return null;
  }, [followed, allStats, profile]);

  const userFranchiseInTop8 = userFranchise ? userFranchise.rank <= 8 : false;

  if (statsLoading || mediaLoading) return <CollegePreviewSkeleton />;

  if (statsError || mediaError) {
    return (
      <section aria-label="College Franchise Rankings">
        <SectionErrorState sectionName="college franchise rankings" onRetry={() => { refetchStats(); refetchMedia(); }} />
      </section>
    );
  }

  if (!podium.length) return null;

  return (
    <section aria-label="College Franchise Rankings">
      {/* 1. SECTION HEADER */}
      <motion.div
        className="flex items-end justify-between px-4 mb-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <p
            className="m-0 flex items-center gap-1.5"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase' as const,
              color: 'hsl(var(--accent-amber))',
              marginBottom: '6px',
            }}
          >
            <Trophy className="w-3.5 h-3.5" />
            2026 Season
          </p>
          <h2
            className="m-0 text-foreground"
            style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}
          >
            College Franchise Rankings
          </h2>
          <p
            className="m-0 mt-1 text-muted-foreground/60"
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            Where college legacies compete on tour
          </p>
        </div>
      </motion.div>

      {/* Hairline divider */}
      <div className="mx-4 mb-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.1)' }} />

      {/* 2. CHASE METRIC */}
      {chaseMetric && (
        <motion.div
          className="px-4 mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'hsl(var(--muted-foreground))',
              padding: '12px 16px',
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border) / 0.5)',
              borderRadius: '16px',
              lineHeight: 1.5,
            }}
          >
            {chaseMetric}
          </div>
        </motion.div>
      )}

      {/* 3. PODIUM — #2 left, #1 centre (tallest), #3 right */}
      <motion.div
        className="px-4 mb-6"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-end" style={{ gap: '8px' }}>
          {podium[1] && (
            <PodiumCard
              stats={podium[1]}
              media={collegeMap?.get(podium[1].normalized_name)}
              rank={2}
              captain={captainMap?.get(podium[1].normalized_name)}
              isUserFranchise={userFranchise?.stats.normalized_name === podium[1].normalized_name}
            />
          )}
          <PodiumCard
            stats={podium[0]}
            media={collegeMap?.get(podium[0].normalized_name)}
            rank={1}
            captain={captainMap?.get(podium[0].normalized_name)}
            isUserFranchise={userFranchise?.stats.normalized_name === podium[0].normalized_name}
          />
          {podium[2] && (
            <PodiumCard
              stats={podium[2]}
              media={collegeMap?.get(podium[2].normalized_name)}
              rank={3}
              captain={captainMap?.get(podium[2].normalized_name)}
              isUserFranchise={userFranchise?.stats.normalized_name === podium[2].normalized_name}
            />
          )}
        </div>
      </motion.div>

      {/* 4. LEADERBOARD ROWS (4th–8th) */}
      <LeaderboardRows
        rows={leaderboardRows}
        mediaMap={collegeMap}
        userFranchiseName={userFranchise?.stats.normalized_name}
      />

      {/* 4b. YOUR FRANCHISE (if outside top 8) */}
      {userFranchise && !userFranchiseInTop8 && (
        <YourFranchiseCard
          stats={userFranchise.stats}
          media={collegeMap?.get(userFranchise.stats.normalized_name)}
          rank={userFranchise.rank}
        />
      )}

      {/* 5. FRANCHISE LEADERS CAROUSEL */}
      <FranchiseLeadersCarousel leaders={franchiseLeaders} />

      {/* 6. PICK YOUR FRANCHISE CTA */}
      <div className="px-4">
        <PickFranchiseCTA onOpen={() => setSheetOpen(true)} />
      </div>

      {/* 7. VIEW FULL FRANCHISE RANKINGS — clean text link */}
      <div className="px-4">
        <button
          onClick={() => navigate('/tourhub/college-golf')}
          className="w-full flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{
            padding: '8px 0',
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
          }}
        >
          <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>
            View Full College Franchise Rankings ›
          </span>
        </button>
      </div>

      {/* Bottom Sheet */}
      <PickFranchiseSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}
