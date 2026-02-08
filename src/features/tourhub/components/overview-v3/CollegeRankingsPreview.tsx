/**
 * CollegeRankingsPreview - Overview page module showing top college programs
 * 
 * Features:
 * - #1 college card with brand gradient + alumni headshots
 * - Top 3 preview cards in horizontal scroll
 * - CTA to full College Rankings page
 * - Uses existing data hooks (useCollegeSeasonStats, useBatchCollegeAlumni, useCollegeMediaMap)
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, GraduationCap } from 'lucide-react';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useBatchCollegeAlumni, type AlumniFace } from '../../hooks/useBatchCollegeAlumni';
import { getCollegeGradientCSS } from '../../config/collegeBrandColors';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

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
    <section className="px-4" style={{ paddingTop: '40px' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-48 rounded-lg" style={shimmerBg} />
      </div>
      <div className="h-40 rounded-2xl" style={shimmerBg} />
    </section>
  );
}

// ============================================================================
// ALUMNI FACE STRIP (inline, compact)
// ============================================================================

function AlumniStrip({ alumni }: { alumni: AlumniFace[] }) {
  if (!alumni.length) return null;

  return (
    <div className="flex items-center mt-3">
      <div className="flex -space-x-2">
        {alumni.slice(0, 4).map((alum) => {
          const photoUrl = resolvePhotoUrl(alum.photo_url, null);
          const initials = alum.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
          
          return (
            <div
              key={alum.id}
              className="w-7 h-7 rounded-full overflow-hidden border-2 border-white flex-shrink-0"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={alum.full_name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[9px] font-bold">
                  {initials}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="ml-2 text-[11px] text-white/70 font-medium">
        {alumni.length} alumni on tour
      </span>
    </div>
  );
}

// ============================================================================
// #1 COLLEGE HERO CARD
// ============================================================================

function TopCollegeCard({
  stats,
  media,
  alumni,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  alumni: AlumniFace[];
}) {
  const navigate = useNavigate();
  const displayName = media?.college_name || stats.normalized_name;
  const gradient = getCollegeGradientCSS(stats.normalized_name);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/college?sort=earnings`)}
      className="w-full rounded-2xl overflow-hidden text-left cursor-pointer"
      style={{
        background: gradient,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="p-5 relative">
        {/* Gold medal badge */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,184,0,0.25) 0%, rgba(255,140,0,0.15) 100%)',
              border: '1px solid rgba(255,184,0,0.3)',
            }}
          >
            <Trophy className="w-3.5 h-3.5" style={{ color: '#FFB800' }} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            #1 This Season
          </span>
        </div>

        {/* College name + logo */}
        <div className="flex items-center gap-3 mb-2">
          {media?.logo_url && (
            <img
              src={media.logo_url}
              alt={displayName}
              className="w-10 h-10 object-contain flex-shrink-0"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            />
          )}
          <h3 className="text-xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.3px' }}>
            {displayName}
          </h3>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white/90">
            {formatCurrency(stats.earnings_total)}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-sm text-white/70">
            {stats.wins_total} win{stats.wins_total !== 1 ? 's' : ''}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-sm text-white/70">
            {stats.player_count} alumni
          </span>
        </div>

        {/* Alumni headshot strip */}
        <AlumniStrip alumni={alumni} />

        {/* Chevron hint */}
        <ChevronRight
          className="absolute top-5 right-5 w-4 h-4 text-white/30"
        />
      </div>
    </motion.button>
  );
}

// ============================================================================
// TOP 3 RUNNER-UP CARDS
// ============================================================================

function RunnerUpCard({
  stats,
  media,
  rank,
  index,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  rank: number;
  index: number;
}) {
  const navigate = useNavigate();
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;

  const medalColors: Record<number, { bg: string; border: string; text: string }> = {
    2: { bg: 'linear-gradient(135deg, #C0C0C0 0%, #9A9A9A 100%)', border: 'rgba(192,192,192,0.3)', text: '#FFFFFF' },
    3: { bg: 'linear-gradient(135deg, #CD7F32 0%, #A0622E 100%)', border: 'rgba(205,127,50,0.3)', text: '#FFFFFF' },
  };

  const medal = medalColors[rank] || { bg: '#E5E7EB', border: 'rgba(0,0,0,0.06)', text: 'rgba(0,0,0,0.5)' };

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/college?sort=earnings`)}
      className="flex-shrink-0 rounded-xl overflow-hidden text-left cursor-pointer bg-card border border-border"
      style={{
        width: '160px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        scrollSnapAlign: 'start',
      }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="p-3.5">
        {/* Rank badge + Logo */}
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: medal.bg,
              border: `1px solid ${medal.border}`,
              fontSize: '11px',
              fontWeight: 700,
              color: medal.text,
            }}
          >
            {rank}
          </div>
          {media?.logo_url && (
            <img
              src={media.logo_url}
              alt={displayName}
              className="w-7 h-7 object-contain flex-shrink-0"
            />
          )}
        </div>

        {/* Name */}
        <h4 className="text-[13px] font-semibold truncate text-foreground mb-1">
          {displayName}
        </h4>

        {/* Earnings */}
        <span className="text-[12px] font-mono font-medium text-muted-foreground">
          {formatCurrency(stats.earnings_total)}
        </span>
      </div>
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CollegeRankingsPreview() {
  const navigate = useNavigate();
  const { data: allStats, isLoading: statsLoading } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();

  // Sort by earnings and get top 3
  const top3 = useMemo(() => {
    if (!allStats?.length) return [];
    return [...allStats]
      .sort((a, b) => b.earnings_total - a.earnings_total)
      .slice(0, 3);
  }, [allStats]);

  // Batch alumni for top college only
  const topCollegeSlugs = useMemo(() => {
    return top3.length > 0 ? [top3[0].normalized_name] : [];
  }, [top3]);
  const { data: alumniMap } = useBatchCollegeAlumni(topCollegeSlugs, 4);

  const totalColleges = allStats?.length || 0;

  if (statsLoading || mediaLoading) {
    return <CollegePreviewSkeleton />;
  }

  if (!top3.length) return null;

  const topCollege = top3[0];
  const topMedia = collegeMap?.get(topCollege.normalized_name);
  const topAlumni = alumniMap?.get(topCollege.normalized_name) || [];
  const runners = top3.slice(1);

  return (
    <section className="px-4" style={{ paddingTop: '40px', paddingBottom: '8px' }}>
      {/* Section Header */}
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
            }}
          >
            <GraduationCap className="w-4 h-4" style={{ color: '#16A34A' }} />
          </div>
          <h2
            className="text-foreground"
            style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}
          >
            College Golf Rankings
          </h2>
        </div>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="flex items-center gap-0.5 group transition-all duration-300 active:scale-95 text-muted-foreground"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          <span className="group-hover:text-primary transition-colors">View All</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all" />
        </button>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-[13px] text-muted-foreground mb-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.05 }}
        style={{ marginTop: '-8px' }}
      >
        See how your college stacks up on tour
      </motion.p>

      {/* #1 College Hero Card */}
      <TopCollegeCard
        stats={topCollege}
        media={topMedia}
        alumni={topAlumni}
      />

      {/* Runner-up cards - horizontal scroll */}
      {runners.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto mt-3 pb-1"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {runners.map((stats, idx) => (
            <RunnerUpCard
              key={stats.id}
              stats={stats}
              media={collegeMap?.get(stats.normalized_name)}
              rank={idx + 2}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* CTA Footer */}
      <motion.button
        onClick={() => navigate('/tourhub/college')}
        className="w-full mt-4 py-3 rounded-xl text-center transition-all duration-300 active:scale-[0.98] bg-card border border-border"
        style={{
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span className="text-foreground">
          Explore All {totalColleges} College Rankings
        </span>
        <span className="ml-1 text-muted-foreground">→</span>
      </motion.button>
    </section>
  );
}