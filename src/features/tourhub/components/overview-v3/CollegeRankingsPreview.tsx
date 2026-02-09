/**
 * CollegeRankingsPreview - Cinematic College Golf Rankings
 * 
 * "This is where elite professional golfers are made."
 * 
 * Professional → Slick → Informative → Cinematic → Gamified
 * One dominant hero. Two challengers. Depth on intent.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, GraduationCap, DollarSign, Users } from 'lucide-react';
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
    <section style={{ paddingTop: '40px', paddingBottom: '8px' }}>
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="h-6 w-48 rounded-lg" style={shimmerBg} />
      </div>
      <div className="mx-4 h-52 rounded-2xl" style={shimmerBg} />
    </section>
  );
}

// ============================================================================
// PIPELINE ALUMNI STRIP
// ============================================================================

function PipelineStrip({ alumni }: { alumni: AlumniFace[] }) {
  if (!alumni.length) return null;

  const displayCount = Math.min(alumni.length, 5);
  const overflow = alumni.length - displayCount;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Label */}
      <p
        className="m-0"
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          marginBottom: '8px',
        }}
      >
        Pipeline to the Tour
      </p>

      {/* Avatar row */}
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {alumni.slice(0, displayCount).map((alum) => {
            const photoUrl = resolvePhotoUrl(alum.photo_url, null);
            const initials = alum.full_name.split(' ').map(n => n[0]).join('').toUpperCase();

            return (
              <div
                key={alum.id}
                className="rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0"
                style={{ width: '30px', height: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={alum.full_name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
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
        {overflow > 0 && (
          <span
            className="ml-2 font-semibold"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}
          >
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// #1 COLLEGE HERO CARD — "The Reigning Dynasty"
// ============================================================================

function HeroCollegeCard({
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="p-5 relative">
        {/* Subtle vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)',
            borderRadius: '16px',
          }}
        />

        <div className="relative">
          {/* #1 THIS SEASON badge */}
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
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              #1 This Season
            </span>
          </div>

          {/* College name + logo */}
          <div className="flex items-center gap-3 mb-4">
            {media?.logo_url && (
              <img
                src={media.logo_url}
                alt={displayName}
                className="w-12 h-12 object-contain flex-shrink-0"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              />
            )}
            <h3
              className="text-white leading-tight"
              style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}
            >
              {displayName}
            </h3>
          </div>

          {/* ═══ THREE STAT PILLARS ═══ */}
          <div
            className="grid grid-cols-3 gap-3"
            style={{
              background: 'rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            {/* Tour Earnings */}
            <div className="text-center">
              <DollarSign className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <p className="m-0 text-white/50" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Earnings
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {formatCurrency(stats.earnings_total)}
              </p>
            </div>

            {/* Season Wins */}
            <div className="text-center">
              <Trophy className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <p className="m-0 text-white/50" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Wins
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {stats.wins_total}
              </p>
            </div>

            {/* Alumni on Tour */}
            <div className="text-center">
              <Users className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.5)' }} />
              <p className="m-0 text-white/50" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Alumni
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {stats.player_count}
              </p>
            </div>
          </div>

          {/* Pipeline to the Tour */}
          <PipelineStrip alumni={alumni} />
        </div>

        {/* Chevron hint */}
        <ChevronRight className="absolute top-5 right-5 w-4 h-4 text-white/25" />
      </div>
    </motion.button>
  );
}

// ============================================================================
// CHASER CARD (#2, #3)
// ============================================================================

function ChaserCard({
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

  const badgeColors: Record<number, { background: string }> = {
    2: { background: 'linear-gradient(135deg, #C0C0C0 0%, #9A9A9A 100%)' },
    3: { background: 'linear-gradient(135deg, #CD7F32 0%, #A0622E 100%)' },
  };
  const badge = badgeColors[rank] || { background: 'rgba(0,0,0,0.1)' };

  // Pick the strongest single stat
  const primaryStat = stats.wins_total >= 2
    ? { label: 'Wins', value: String(stats.wins_total) }
    : { label: 'Earnings', value: formatCurrency(stats.earnings_total) };

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/college?sort=earnings`)}
      className="flex-shrink-0 text-left cursor-pointer active:scale-[0.97] transition-transform duration-150"
      style={{
        width: 'calc(50% - 6px)',
        minWidth: '155px',
        padding: '14px',
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Badge + Logo */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: badge.background }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>{rank}</span>
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
      <h4 className="text-foreground truncate m-0" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
        {displayName}
      </h4>

      {/* One defining stat */}
      <div className="flex items-baseline gap-1">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '16px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
          }}
        >
          {primaryStat.value}
        </span>
      </div>
      <p className="m-0 text-muted-foreground" style={{ fontSize: '10px', fontWeight: 500, marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {primaryStat.label}
      </p>
    </motion.button>
  );
}

// ============================================================================
// NARRATIVE CONTEXT STRIP
// ============================================================================

function NarrativeStrip({ topCollege, allStats }: { topCollege: CollegeSeasonStats; allStats: CollegeSeasonStats[] }) {
  // Generate dynamic editorial line
  const narrative = useMemo(() => {
    const name = topCollege.normalized_name
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    if (topCollege.wins_total >= 3) {
      return `${name} dominates with ${topCollege.wins_total} wins this season`;
    }
    return `${name} leads the nation in tour earnings`;
  }, [topCollege]);

  return (
    <p
      className="m-0 text-muted-foreground"
      style={{
        fontSize: '12px',
        fontWeight: 500,
        fontStyle: 'italic',
        padding: '0',
      }}
    >
      {narrative}
    </p>
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
  const { data: alumniMap } = useBatchCollegeAlumni(topCollegeSlugs, 5);

  if (statsLoading || mediaLoading) {
    return <CollegePreviewSkeleton />;
  }

  if (!top3.length) return null;

  const topCollege = top3[0];
  const topMedia = collegeMap?.get(topCollege.normalized_name);
  const topAlumni = alumniMap?.get(topCollege.normalized_name) || [];
  const chasers = top3.slice(1);

  return (
    <section style={{ paddingTop: '40px', paddingBottom: '8px' }}>
      {/* ═══ SECTION HEADER ═══ */}
      <motion.div
        className="flex items-end justify-between px-4 mb-1"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
              }}
            >
              <GraduationCap className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
            </div>
            <h2
              className="text-foreground m-0"
              style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}
            >
              College Golf Rankings
            </h2>
          </div>
          <p className="m-0 text-muted-foreground" style={{ fontSize: '12px', marginTop: '4px', marginLeft: '36px' }}>
            See how your college stacks up on tour
          </p>
        </div>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="flex items-center gap-0.5 group transition-all duration-300 bg-transparent border-none cursor-pointer"
          style={{ color: 'rgba(0,0,0,0.35)', fontSize: '13px', fontWeight: 600 }}
        >
          View All
          <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </motion.div>

      {/* ═══ EDITORIAL CONTEXT STRIP ═══ */}
      <motion.div
        className="px-4 mb-4"
        style={{ marginTop: '8px' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <NarrativeStrip topCollege={topCollege} allStats={allStats || []} />
      </motion.div>

      {/* ═══ #1 COLLEGE HERO ═══ */}
      <div className="px-4">
        <HeroCollegeCard
          stats={topCollege}
          media={topMedia}
          alumni={topAlumni}
        />
      </div>

      {/* ═══ THE CHASERS (#2 & #3) ═══ */}
      {chasers.length > 0 && (
        <div className="px-4" style={{ marginTop: '12px' }}>
          <p
            className="m-0 text-muted-foreground"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            The Chasers
          </p>
          <div className="flex" style={{ gap: '12px' }}>
            {chasers.map((stats, idx) => (
              <ChaserCard
                key={stats.id}
                stats={stats}
                media={collegeMap?.get(stats.normalized_name)}
                rank={idx + 2}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ CTA — TEXT-ONLY ═══ */}
      <div className="px-4" style={{ marginTop: '16px' }}>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="flex items-center gap-1 group transition-all duration-200 bg-transparent border-none cursor-pointer active:scale-[0.98]"
          style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,0,0,0.4)' }}
        >
          <span className="group-hover:text-foreground transition-colors">
            View Full College Rankings
          </span>
          <ChevronRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </section>
  );
}
