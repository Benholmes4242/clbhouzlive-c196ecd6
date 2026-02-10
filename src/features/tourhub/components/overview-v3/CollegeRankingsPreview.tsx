/**
 * CollegeRankingsPreview - Cinematic College Golf Rankings
 * 
 * "This is where elite professional golfers are made."
 * 
 * Professional → Slick → Informative → Cinematic → Gamified
 * One dominant hero. Two challengers. Depth on intent.
 */

import { useMemo, useState } from 'react';
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
// PIPELINE ALUMNI AVATAR (with proper photo resolution)
// ============================================================================

function AlumniAvatar({ alum }: { alum: AlumniFace }) {
  const photoUrl = resolvePhotoUrl(alum.photo_url, alum.pga_tour_id);
  const initials = alum.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const [imgError, setImgError] = useState(false);

  const showPhoto = photoUrl && !imgError;

  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{
        width: '34px',
        height: '34px',
        border: '2px solid rgba(255,255,255,0.7)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt={alum.full_name}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PIPELINE STRIP
// ============================================================================

function PipelineStrip({ alumni }: { alumni: AlumniFace[] }) {
  if (!alumni.length) return null;

  const displayCount = Math.min(alumni.length, 5);
  const overflow = alumni.length - displayCount;

  return (
    <div style={{ marginTop: '14px' }}>
      <p
        className="m-0"
        style={{
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '8px',
        }}
      >
        Pipeline to the Tour
      </p>

      <div className="flex items-center">
        <div className="flex" style={{ marginLeft: '0' }}>
          {alumni.slice(0, displayCount).map((alum, idx) => (
            <div
              key={alum.id}
              style={{ marginLeft: idx === 0 ? '0' : '-8px', zIndex: displayCount - idx }}
            >
              <AlumniAvatar alum={alum} />
            </div>
          ))}
        </div>
        {overflow > 0 && (
          <span
            className="ml-2 font-semibold"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}
          >
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// #1 COLLEGE HERO CARD
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
      className="w-full overflow-hidden text-left cursor-pointer aspect-square"
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
      <div className="p-5 relative h-full flex flex-col justify-end">
        {/* Subtle vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        <div className="relative">
          {/* #1 THIS SEASON badge — refined */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,184,0,0.2) 0%, rgba(255,140,0,0.12) 100%)',
                  border: '1px solid rgba(255,184,0,0.25)',
                }}
              >
                <Trophy className="w-3 h-3" style={{ color: '#FFB800' }} />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                #1 This Season
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </div>

          {/* College name + logo */}
          <div className="flex items-center gap-3 mb-4">
            {media?.logo_url && (
              <img
                src={media.logo_url}
                alt={displayName}
                className="w-11 h-11 object-contain flex-shrink-0"
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

          {/* THREE STAT PILLARS with faint dividers */}
          <div
            className="grid grid-cols-3"
            style={{
              background: 'rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '12px 0',
            }}
          >
            {/* Tour Earnings */}
            <div className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <DollarSign className="w-3 h-3 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="m-0" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Earnings
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {formatCurrency(stats.earnings_total)}
              </p>
            </div>

            {/* Season Wins */}
            <div className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <Trophy className="w-3 h-3 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="m-0" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Wins
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '15px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {stats.wins_total}
              </p>
            </div>

            {/* Alumni on Tour */}
            <div className="text-center">
              <Users className="w-3 h-3 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="m-0" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
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
      </div>
    </motion.button>
  );
}

// ============================================================================
// CHASER CARD (#2, #3) — Horizontal split: logo left, stats right
// ============================================================================

function ChaserCard({
  stats,
  media,
  rank,
  leaderStats,
  index,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  rank: number;
  leaderStats: CollegeSeasonStats;
  index: number;
}) {
  const navigate = useNavigate();
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;

  // Gap to leader
  const earningsGap = stats.earnings_total - leaderStats.earnings_total;
  const winsGap = stats.wins_total - leaderStats.wins_total;
  const gapText = winsGap < 0
    ? `${winsGap} wins to #1`
    : `${earningsGap < 0 ? formatCurrency(earningsGap) : '$0'} to #1`;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/college?sort=earnings`)}
      className="flex-shrink-0 text-left cursor-pointer active:scale-[0.97] transition-transform duration-150"
      style={{
        width: 'calc(50% - 6px)',
        minWidth: '155px',
        padding: '12px',
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
      {/* Horizontal split: Logo left, info right */}
      <div className="flex" style={{ gap: '10px' }}>
        {/* LEFT: Logo */}
        <div className="flex-shrink-0 flex items-start" style={{ paddingTop: '2px' }}>
          {media?.logo_url ? (
            <img
              src={media.logo_url}
              alt={displayName}
              className="object-contain flex-shrink-0"
              style={{ width: '48px', height: '48px' }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-xl bg-muted flex-shrink-0"
              style={{ width: '48px', height: '48px' }}
            >
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* RIGHT: Name, stats, gap */}
        <div className="flex-1 min-w-0">
          {/* Rank + Name */}
          <div className="flex items-center" style={{ gap: '4px' }}>
            <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              #{rank}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: '11px' }}>·</span>
            <span className="truncate text-foreground" style={{ fontSize: '13px', fontWeight: 700 }}>
              {displayName}
            </span>
          </div>

          {/* All three stats inline */}
          <p className="m-0 text-muted-foreground truncate" style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px' }}>
            {stats.wins_total} Wins · {formatCurrency(stats.earnings_total)}
          </p>
          <p className="m-0 text-muted-foreground" style={{ fontSize: '10px', fontWeight: 500, marginTop: '1px' }}>
            {stats.player_count} Alumni on Tour
          </p>

          {/* Gap to leader */}
          <p className="m-0" style={{ fontSize: '10px', fontWeight: 500, marginTop: '4px', color: 'rgba(0,0,0,0.35)', fontVariantNumeric: 'tabular-nums' }}>
            {gapText}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// NARRATIVE CONTEXT STRIP
// ============================================================================

function NarrativeStrip({ topCollege }: { topCollege: CollegeSeasonStats }) {
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
    <div
      className="rounded-md"
      style={{
        borderLeft: '2px solid hsl(142 76% 36% / 0.25)',
        background: 'hsl(142 76% 36% / 0.03)',
        padding: '8px 10px',
      }}
    >
      <p
        className="m-0 text-muted-foreground"
        style={{ fontSize: '12px', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.4 }}
      >
        {narrative}
      </p>
    </div>
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
      {/* SECTION HEADER */}
      <motion.div
        className="flex items-end justify-between px-4 mb-1"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" style={{ marginBottom: '-1px' }} />
            <h2
              className="text-foreground m-0"
              style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.2px' }}
            >
              College Golf Rankings
            </h2>
          </div>
          <p className="m-0 text-muted-foreground" style={{ fontSize: '11px', marginTop: '3px', marginLeft: '24px' }}>
            See how your college stacks up on tour
          </p>
        </div>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="flex items-center gap-0.5 group transition-all duration-300 bg-transparent border-none cursor-pointer"
          style={{ color: 'rgba(0,0,0,0.35)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          View All
          <ChevronRight size={12} className="opacity-60" />
        </button>
      </motion.div>

      {/* Hairline divider */}
      <div className="mx-4 mb-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.1)' }} />

      {/* NARRATIVE STRIP — editorial pull-quote style */}
      <motion.div
        className="px-4 mb-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <NarrativeStrip topCollege={topCollege} />
      </motion.div>

      {/* #1 COLLEGE HERO — full-width edge-to-edge */}
      <div>
        <HeroCollegeCard
          stats={topCollege}
          media={topMedia}
          alumni={topAlumni}
        />
      </div>

      {/* THE CHASERS (#2 & #3) */}
      {chasers.length > 0 && (
        <div className="px-4" style={{ marginTop: '16px' }}>
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
            {chasers.map((s, idx) => (
              <ChaserCard
                key={s.id}
                stats={s}
                media={collegeMap?.get(s.normalized_name)}
                rank={idx + 2}
                leaderStats={topCollege}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA — TEXT-ONLY */}
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
