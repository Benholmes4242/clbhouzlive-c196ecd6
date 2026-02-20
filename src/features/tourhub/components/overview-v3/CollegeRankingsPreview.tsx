/**
 * CollegeRankingsPreview — Franchise Rankings (Phase 1 redesign)
 *
 * Podium layout: #1 centre (tallest), #2 left, #3 right.
 * Dynamic chase-metric narrative, squad captains, pick-your-franchise CTA.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, DollarSign, Users } from 'lucide-react';
import { SectionErrorState } from '../SectionErrorState';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useFranchiseCaptains, type FranchiseCaptain } from '../../hooks/useFranchiseCaptains';
import { useFollowedColleges } from '../../hooks/useCollegeMovers';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';

// ============================================================================
// GRADIENTS
// ============================================================================
const PODIUM_GRADIENTS = {
  first: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  runner: 'linear-gradient(135deg, #2d2d3a 0%, #3d3d4a 100%)',
};

// ============================================================================
// SKELETON
// ============================================================================
function CollegePreviewSkeleton() {
  const shimmerBg = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
  };

  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="h-6 w-48 rounded-lg" style={shimmerBg} />
      </div>
      <div className="mx-4 h-72 rounded-2xl" style={shimmerBg} />
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
  stats,
  media,
  rank,
  captain,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  rank: 1 | 2 | 3;
  captain: FranchiseCaptain | undefined;
}) {
  const navigate = useNavigate();
  const isFirst = rank === 1;
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;
  const captainPhotoUrl = captain ? resolvePhotoUrl(captain.photoUrl, captain.pgaTourId) : null;

  return (
    <button
      onClick={() => navigate('/tourhub/college?sort=earnings')}
      className="flex flex-col text-left overflow-hidden active:scale-[0.97] transition-transform"
      style={{
        flex: isFirst ? '1 1 45%' : '1 1 27.5%',
        background: isFirst ? PODIUM_GRADIENTS.first : PODIUM_GRADIENTS.runner,
        borderRadius: isFirst ? '16px' : '12px',
        minHeight: isFirst ? '240px' : '200px',
        alignSelf: 'flex-end',
      }}
    >
      {/* Main content */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-center"
        style={{ padding: isFirst ? '20px 12px 0' : '14px 8px 0' }}
      >
        {/* Rank badge */}
        <div className="flex items-center mb-2" style={{ gap: '4px' }}>
          {isFirst && <span style={{ fontSize: '14px' }}>🏆</span>}
          <span
            style={{
              fontSize: isFirst ? '11px' : '10px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            #{rank}
          </span>
        </div>

        {/* Logo */}
        {media?.logo_url && (
          <img
            src={media.logo_url}
            alt={displayName}
            className="object-contain mb-2"
            style={{
              width: isFirst ? '80px' : '50px',
              height: isFirst ? '80px' : '50px',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
            }}
          />
        )}

        {/* Name */}
        <h3
          className="text-white leading-tight m-0 mb-1"
          style={{
            fontSize: isFirst ? '20px' : '14px',
            fontWeight: isFirst ? 700 : 600,
            letterSpacing: '-0.3px',
          }}
        >
          {displayName}
        </h3>

        {/* Earnings */}
        <p
          className="m-0 text-white"
          style={{
            fontSize: isFirst ? '16px' : '13px',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {formatCurrency(stats.earnings_total)}
        </p>

        {/* Wins + Alumni */}
        <p
          className="m-0"
          style={{
            fontSize: isFirst ? '12px' : '11px',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '4px',
          }}
        >
          {stats.wins_total} {stats.wins_total === 1 ? 'win' : 'wins'} · {stats.player_count} alumni
        </p>
      </div>

      {/* Squad Captain */}
      {captain && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: isFirst ? '10px 12px' : '8px 8px',
            marginTop: 'auto',
          }}
        >
          {isFirst && (
            <p
              className="m-0"
              style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '6px',
              }}
            >
              Squad Captain
            </p>
          )}
          <div className="flex items-center" style={{ gap: '6px' }}>
            <SquircleAvatar
              size={isFirst ? 28 : 22}
              src={captainPhotoUrl}
              alt={captain.fullName}
              hideRing
              fallback={captain.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            />
            <div className="min-w-0">
              <p
                className="m-0 text-white truncate"
                style={{
                  fontSize: isFirst ? '12px' : '10px',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {isFirst
                  ? captain.fullName
                  : `${captain.fullName.split(' ')[0]?.[0]}. ${captain.fullName.split(' ').slice(1).join(' ')}`}
              </p>
              <p
                className="m-0"
                style={{
                  fontSize: isFirst ? '11px' : '9px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: "'JetBrains Mono', monospace",
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
// PICK YOUR FRANCHISE CTA
// ============================================================================
function PickFranchiseCTA() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { data: followed } = useFollowedColleges(user?.id);

  const hasCollege = !!(profile as any)?.college_normalized;
  const hasFollowed = (followed?.length ?? 0) > 0;

  if (!user || hasCollege || hasFollowed) return null;

  return (
    <button
      onClick={() => navigate('/tourhub/college')}
      className="w-full flex items-center text-left active:scale-[0.97] transition-transform"
      style={{
        background: 'rgba(0,0,0,0.02)',
        border: '1px dashed rgba(0,0,0,0.12)',
        borderRadius: '12px',
        padding: '16px',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '20px' }}>🏛</span>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>
          Pick your franchise
        </p>
        <p className="m-0" style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
          Follow a college and join the rivalry
        </p>
      </div>
      <ChevronRight size={16} style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function CollegeRankingsPreview() {
  const navigate = useNavigate();
  const { data: allStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading, error: mediaError, refetch: refetchMedia } = useCollegeMediaMap();

  // Sort by earnings → top 3
  const top3 = useMemo(() => {
    if (!allStats?.length) return [];
    return [...allStats].sort((a, b) => b.earnings_total - a.earnings_total).slice(0, 3);
  }, [allStats]);

  const topCollegeSlugs = useMemo(() => top3.map(s => s.normalized_name), [top3]);

  // Squad captains for top 3
  const { data: captainMap } = useFranchiseCaptains(topCollegeSlugs);

  // Chase metric
  const chaseMetric = useMemo(() => generateChaseMetric(top3, collegeMap), [top3, collegeMap]);

  if (statsLoading || mediaLoading) return <CollegePreviewSkeleton />;

  if (statsError || mediaError) {
    return (
      <section aria-label="Franchise Rankings">
        <SectionErrorState sectionName="franchise rankings" onRetry={() => { refetchStats(); refetchMedia(); }} />
      </section>
    );
  }

  if (!top3.length) return null;

  return (
    <section>
      {/* SECTION HEADER */}
      <motion.div
        className="flex items-end justify-between px-4 mb-1"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h2
            className="m-0 text-foreground"
            style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}
          >
            Franchise Rankings
          </h2>
          <p
            className="m-0"
            style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(0,0,0,0.45)', fontStyle: 'italic', marginTop: '3px' }}
          >
            Where college legacies compete on tour
          </p>
        </div>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer text-muted-foreground"
          style={{ fontSize: '13px', fontWeight: 500, minHeight: '44px' }}
        >
          View All
          <ChevronRight size={12} className="opacity-60" />
        </button>
      </motion.div>

      {/* Hairline divider */}
      <div className="mx-4 mb-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.1)' }} />

      {/* CHASE METRIC */}
      {chaseMetric && (
        <motion.div
          className="px-4 mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: 'rgba(0,0,0,0.55)',
              fontStyle: 'italic',
              padding: '12px 16px',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '10px',
              borderLeft: '3px solid rgba(0,0,0,0.08)',
              lineHeight: 1.5,
            }}
          >
            {chaseMetric}
          </div>
        </motion.div>
      )}

      {/* PODIUM — #2 left, #1 centre (tallest), #3 right */}
      <motion.div
        className="px-4 mb-4"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-end" style={{ gap: '8px' }}>
          {/* #2 — left */}
          {top3[1] && (
            <PodiumCard
              stats={top3[1]}
              media={collegeMap?.get(top3[1].normalized_name)}
              rank={2}
              captain={captainMap?.get(top3[1].normalized_name)}
            />
          )}
          {/* #1 — centre */}
          <PodiumCard
            stats={top3[0]}
            media={collegeMap?.get(top3[0].normalized_name)}
            rank={1}
            captain={captainMap?.get(top3[0].normalized_name)}
          />
          {/* #3 — right */}
          {top3[2] && (
            <PodiumCard
              stats={top3[2]}
              media={collegeMap?.get(top3[2].normalized_name)}
              rank={3}
              captain={captainMap?.get(top3[2].normalized_name)}
            />
          )}
        </div>
      </motion.div>

      {/* PICK YOUR FRANCHISE CTA */}
      <div className="px-4 mb-3">
        <PickFranchiseCTA />
      </div>

      {/* VIEW FULL FRANCHISE RANKINGS */}
      <div className="px-4">
        <button
          onClick={() => navigate('/tourhub/college')}
          className="w-full flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{
            padding: '14px',
            background: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '12px',
          }}
        >
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>
            View Full Franchise Rankings ›
          </span>
        </button>
      </div>
    </section>
  );
}
