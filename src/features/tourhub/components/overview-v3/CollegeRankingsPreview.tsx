/**
 * CollegeRankingsPreview — Franchise Rankings (Dispatch redesign)
 *
 * Horizontal scroll podium cards, dispatch table rows, franchise leaders carousel.
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
// PODIUM CARD — dispatch horizontal strip card
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
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;
  const captainPhoto = captain
    ? getPlayerHeadshotUrl(captain.fullName, (captain as any).tourCodes?.[0] ?? (captain as any).tourCode ?? 'pga')
    : null;
  const logoUrl = getCollegeLogoUrl(media?.college_name || stats.normalized_name);
  const isFirst = rank === 1;

  return (
    <button
      onClick={() => navigate(`/tourhub/college-golf/${stats.normalized_name}`)}
      className="flex flex-col text-left overflow-hidden active:scale-[0.97] transition-transform flex-shrink-0"
      style={{
        width: '150px',
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: isFirst ? '#F7931E' : 'rgba(15,23,42,0.06)', flexShrink: 0 }} />

      <div style={{ padding: '14px 12px', textAlign: 'center', flex: 1 }}>
        {isUserFranchise && (
          <div style={{ marginBottom: '6px' }}>
            <YourFranchiseBadge />
          </div>
        )}

        <div style={{
          fontSize: '9px', fontWeight: 900,
          color: isFirst ? '#F7931E' : '#CBD5E1',
          letterSpacing: '0.14em', marginBottom: '10px',
        }}>
          #{rank}
        </div>

        {logoUrl && (
          <img
            src={logoUrl}
            alt={displayName}
            style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', display: 'block', margin: '0 auto' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '10px 0 3px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {displayName}
        </h3>

        <p style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.03em' }}>
          {formatCurrency(stats.earnings_total)}
        </p>

        <p style={{ fontSize: '10px', color: '#94A3B8', margin: '3px 0 0' }}>
          {stats.wins_total} {stats.wins_total === 1 ? 'win' : 'wins'} · {stats.player_count} on tour
        </p>
      </div>

      {captain && (
        <div style={{
          borderTop: '0.5px solid rgba(15,23,42,0.07)',
          padding: '10px 12px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '8px', fontWeight: 900,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: '#CBD5E1', margin: '0 0 6px',
          }}>
            Captain
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <SquircleAvatar
              size={24}
              src={captainPhoto || PLAYER_SILHOUETTE_URL}
              alt={captain.fullName}
              hideRing
              fallback={captain.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            />
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              {abbreviateName(captain.fullName)}
            </p>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#F7931E', margin: 0 }}>
              {formatCurrency(captain.earnings)}
            </p>
          </div>
        </div>
      )}
    </button>
  );
}

// ============================================================================
// LEADERBOARD ROWS (4th–8th) — dispatch table style
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
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginBottom: '16px' }}>
      {/* Column headers */}
      <div style={{ display: 'flex', padding: '8px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.08)' }}>
        <div style={{ width: 32, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>#</div>
        <div style={{ flex: 1, fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Franchise</div>
        <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Earnings on Tour</div>
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
            className="w-full flex items-center active:bg-muted/20 transition-colors"
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: i < rows.length - 1 ? '0.5px solid rgba(15,23,42,0.06)' : 'none',
            }}
          >
            <span style={{ width: '32px', fontSize: '16px', fontWeight: 900, color: 'rgba(15,23,42,0.12)', flexShrink: 0 }}>{rank}</span>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '8px' }}>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={displayName}
                  style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{displayName}</span>
              {userFranchiseName === stats.normalized_name && <YourFranchiseBadge />}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
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
    <div style={{ marginBottom: '24px' }}>
      {/* Section heading — dispatch rule marker */}
      <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const, display: 'block' }}>
            Franchise Leaders
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            Which franchise leads each category?
          </span>
        </div>
      </div>

      {/* Scroll container */}
      <div
        className="flex overflow-x-auto scrollbar-hide"
        role="list"
        aria-label="Franchise statistical leaders by category"
        style={{
          gap: '8px',
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
                width: '152px',
                minHeight: '140px',
                background: '#ffffff',
                border: '1px solid rgba(15,23,42,0.08)',
                borderRadius: '14px',
                padding: '14px',
                boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                scrollSnapAlign: 'start',
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
                  color: '#94A3B8',
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
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, marginBottom: '2px' }}>
                {leader.media?.short_name || leader.media?.college_name || leader.college.normalized_name}
              </span>

              {/* Stat value */}
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '2px', fontVariantNumeric: 'tabular-nums' }}>
                {leader.value}
              </span>

              {/* Alumni count */}
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>
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
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: '14px',
        padding: '14px 16px',
        gap: '12px',
        boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
        cursor: 'pointer',
      }}
    >
      <GraduationCap className="w-5 h-5 shrink-0" style={{ color: '#F7931E' }} />
      <div className="flex-1 min-w-0">
        <p className="m-0" style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
          Pick your franchise
        </p>
        <p className="m-0" style={{ fontSize: '12px', color: '#94A3B8' }}>
          Follow a college and join the rivalry
        </p>
      </div>
      <ChevronRight size={16} style={{ color: '#94A3B8' }} className="flex-shrink-0" />
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
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
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
            className="object-contain"
            style={{ width: '28px', height: '28px', borderRadius: '6px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <span className="truncate block" style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
            {displayName}
          </span>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            {formatCurrency(stats.earnings_total)} earnings · {stats.player_count} pros on tour
          </span>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#94A3B8' }}>
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
    <section aria-label="College Franchise Rankings" style={{ background: '#F8FAFC' }}>
      {/* ═══ SECTION HEADER ═══ */}
      <motion.div
        className="px-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {/* Amber eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Trophy style={{ width: 14, height: 14, color: '#F7931E' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F7931E', letterSpacing: '0.05em' }}>
                2026 Season
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05 }}>
              College Franchise Rankings
            </h2>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }}>
              Where college legacies compete on tour
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ CHASE METRIC ═══ */}
      {chaseMetric && (
        <motion.div
          className="px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ marginBottom: '16px' }}
        >
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 14px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(15,23,42,0.08)',
            borderLeft: '3px solid #F7931E',
          }}>
            <p style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#475569',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {chaseMetric}
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ PODIUM — horizontal scroll strip ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: '16px' }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '2px',
          }}
        >
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

      {/* ═══ LEADERBOARD ROWS (4th–8th) ═══ */}
      <LeaderboardRows
        rows={leaderboardRows}
        mediaMap={collegeMap}
        userFranchiseName={userFranchise?.stats.normalized_name}
      />

      {/* YOUR FRANCHISE (if outside top 8) */}
      {userFranchise && !userFranchiseInTop8 && (
        <YourFranchiseCard
          stats={userFranchise.stats}
          media={collegeMap?.get(userFranchise.stats.normalized_name)}
          rank={userFranchise.rank}
        />
      )}

      {/* ═══ FRANCHISE LEADERS CAROUSEL ═══ */}
      <FranchiseLeadersCarousel leaders={franchiseLeaders} />

      {/* ═══ PICK YOUR FRANCHISE CTA ═══ */}
      <div className="px-4">
        <PickFranchiseCTA onOpen={() => setSheetOpen(true)} />
      </div>

      {/* ═══ VIEW FULL FRANCHISE RANKINGS ═══ */}
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
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
            View Full College Franchise Rankings ›
          </span>
        </button>
      </div>

      {/* Bottom Sheet */}
      <PickFranchiseSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}
