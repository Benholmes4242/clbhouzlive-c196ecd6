/**
 * CollegeRankingsPreview - College Power Rankings
 * 
 * "Who's producing the strongest tour talent?"
 * 
 * #1 hero: full-width square card with large logo + two featured players (top earner, most wins)
 * #2/#3 chasers: stacked vertically, same card style as performance rankings leader
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, GraduationCap, DollarSign, Trophy, Users } from 'lucide-react';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';
import { useBatchCollegeAlumni, type AlumniFace } from '../../hooks/useBatchCollegeAlumni';
import { getCollegeGradientCSS } from '../../config/collegeBrandColors';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { resolvePhotoUrl, getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Amber accent (matches Performance Rankings)
const AMBER = {
  primary: '#f59e0b',
  bgLight: 'rgba(245, 158, 11, 0.04)',
  bgMedium: 'rgba(245, 158, 11, 0.08)',
  border: 'rgba(245, 158, 11, 0.2)',
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
      <div className="mx-4 h-52 rounded-2xl" style={shimmerBg} />
    </section>
  );
}

// ============================================================================
// FEATURED PLAYER PILL (squircle avatar + label)
// ============================================================================

function FeaturedPlayerPill({
  alum,
  label,
  icon: Icon,
}: {
  alum: AlumniFace;
  label: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}) {
  const photoUrl = resolvePhotoUrl(alum.photo_url, alum.pga_tour_id);
  
  return (
    <div className="flex items-center" style={{ gap: '8px' }}>
      <SquircleAvatar
        size={34}
        src={photoUrl}
        alt={alum.full_name}
        hideRing
        fallback={alum.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      />
      <div className="min-w-0">
        <p className="m-0 text-white truncate" style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>
          {alum.full_name}
        </p>
        <div className="flex items-center" style={{ gap: '3px', marginTop: '1px' }}>
          <Icon className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.45)' }} />
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
            {label}
          </span>
        </div>
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

  // Pick two featured alumni: first as "Top Earner", second as "Most Wins"
  const topEarner = alumni[0] || null;
  const topWinner = alumni[1] || null;

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
      <div className="relative h-full flex flex-col">
        {/* Subtle vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Chevron — top right */}
        <div className="absolute top-4 right-4 z-10">
          <ChevronRight className="w-4 h-4 text-white/20" />
        </div>

        {/* Centered vertical stack — logo, badge, name, stats */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-5">
          {/* Logo — large, no frosted circle */}
          {media?.logo_url && (
            <img
              src={media.logo_url}
              alt={displayName}
              className="object-contain mb-4"
              style={{
                width: '110px',
                height: '110px',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            />
          )}

          {/* #1 THIS SEASON badge */}
          <div className="flex items-center gap-2 mb-2">
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

          {/* College name — centered, larger */}
          <h3
            className="text-white leading-tight text-center m-0 mb-4"
            style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.4px' }}
          >
            {displayName}
          </h3>

          {/* THREE STAT PILLARS */}
          <div
            className="grid grid-cols-3 w-full"
            style={{
              background: 'rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '12px 0',
            }}
          >
            <div className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <DollarSign className="w-3 h-3 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="m-0" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Earnings
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '17px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {formatCurrency(stats.earnings_total)}
              </p>
            </div>
            <div className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <Trophy className="w-3 h-3 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="m-0" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Wins
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '17px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {stats.wins_total}
              </p>
            </div>
            <div className="text-center">
              <Users className="w-3 h-3 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <p className="m-0" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                Alumni
              </p>
              <p className="m-0 text-white font-bold" style={{ fontSize: '17px', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                {stats.player_count}
              </p>
            </div>
          </div>
        </div>

        {/* Featured players — bottom */}
        <div className="relative px-5 pb-5" style={{ marginTop: 'auto' }}>
          <div className="flex items-center justify-between">
            {topEarner && (
              <FeaturedPlayerPill alum={topEarner} label="Top Earner" icon={DollarSign} />
            )}
            {topWinner && (
              <FeaturedPlayerPill alum={topWinner} label="Most Wins" icon={Trophy} />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// CHASER CARD (#2, #3) — Stacked, same style as Performance Rankings leader
// Left: college logo, Right: stats + two featured alumni
// ============================================================================

function ChaserCard({
  stats,
  media,
  rank,
  leaderStats,
  alumni,
  index,
}: {
  stats: CollegeSeasonStats;
  media: CollegeMedia | undefined;
  rank: number;
  leaderStats: CollegeSeasonStats;
  alumni: AlumniFace[];
  index: number;
}) {
  const navigate = useNavigate();
  const displayName = media?.short_name || media?.college_name || stats.normalized_name;

  // Gap to leader
  const earningsGap = stats.earnings_total - leaderStats.earnings_total;
  const absGap = Math.abs(earningsGap);
  const gapText = earningsGap < 0 ? `-${formatCurrency(absGap).replace('$', '')} to #1` : 'Tied';

  const topEarner = alumni[0] || null;
  const topWinner = alumni[1] || null;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/college?sort=earnings`)}
      className="w-full text-left relative overflow-hidden active:scale-[0.99] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        padding: '20px',
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Horizontal split: Logo left, Info right */}
      <div className="relative flex" style={{ gap: '18px' }}>
        {/* LEFT: College logo - edge-to-edge */}
        <div className="flex-shrink-0 -ml-5 -my-5 flex items-center justify-center"
          style={{
            width: '120px',
            minHeight: '140px',
            borderTopLeftRadius: '20px',
            borderBottomLeftRadius: '20px',
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          {media?.logo_url ? (
            <img
              src={media.logo_url}
              alt={displayName}
              className="object-contain"
              style={{ width: '72px', height: '72px' }}
            />
          ) : (
            <GraduationCap className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        {/* RIGHT: Name, stats, featured players */}
        <div className="flex-1 min-w-0 flex flex-col justify-center items-center text-center">
          {/* Rank + Name */}
          <div className="flex items-center" style={{ gap: '4px' }}>
            <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              #{rank}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: '11px' }}>·</span>
            <span className="truncate text-foreground" style={{ fontSize: '16px', fontWeight: 700 }}>
              {displayName}
            </span>
          </div>

          {/* Stats row */}
          <p className="m-0 text-muted-foreground" style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
            {formatCurrency(stats.earnings_total)} · {stats.wins_total} Wins · {stats.player_count} Alumni
          </p>

          {/* Gap to leader */}
          <p className="m-0" style={{ fontSize: '10px', fontWeight: 500, marginTop: '2px', color: 'rgba(0,0,0,0.35)', fontVariantNumeric: 'tabular-nums' }}>
            {gapText}
          </p>

          {/* Featured alumni squircles */}
          {(topEarner || topWinner) && (
            <div className="flex items-center justify-center mt-3" style={{ gap: '12px' }}>
              {topEarner && (
                <div className="flex items-center" style={{ gap: '5px' }}>
                  <SquircleAvatar
                    size={24}
                    src={resolvePhotoUrl(topEarner.photo_url, topEarner.pga_tour_id)}
                    alt={topEarner.full_name}
                    hideRing
                    fallback={topEarner.full_name[0]}
                  />
                  <div>
                    <p className="m-0 truncate text-foreground" style={{ fontSize: '10px', fontWeight: 600, lineHeight: 1.1, maxWidth: '70px' }}>
                      {topEarner.full_name.split(' ').pop()}
                    </p>
                    <p className="m-0 text-muted-foreground" style={{ fontSize: '8px', fontWeight: 500 }}>Top Earner</p>
                  </div>
                </div>
              )}
              {topWinner && (
                <div className="flex items-center" style={{ gap: '5px' }}>
                  <SquircleAvatar
                    size={24}
                    src={resolvePhotoUrl(topWinner.photo_url, topWinner.pga_tour_id)}
                    alt={topWinner.full_name}
                    hideRing
                    fallback={topWinner.full_name[0]}
                  />
                  <div>
                    <p className="m-0 truncate text-foreground" style={{ fontSize: '10px', fontWeight: 600, lineHeight: 1.1, maxWidth: '70px' }}>
                      {topWinner.full_name.split(' ').pop()}
                    </p>
                    <p className="m-0 text-muted-foreground" style={{ fontSize: '8px', fontWeight: 500 }}>Most Wins</p>
                  </div>
                </div>
              )}
            </div>
          )}
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

    return `${name} dominates with ${formatCurrency(topCollege.earnings_total)} in tour earnings this season`;
  }, [topCollege]);

  return (
    <div
      className="rounded-md"
      style={{
        borderLeft: '2px solid rgba(245, 158, 11, 0.3)',
        background: 'rgba(245, 158, 11, 0.03)',
        padding: '8px 10px',
      }}
    >
      <p
        className="m-0 text-muted-foreground"
        style={{ fontSize: '13px', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.4 }}
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

  // Batch alumni for all top 3 colleges
  const topCollegeSlugs = useMemo(() => {
    return top3.map(s => s.normalized_name);
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
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" style={{ marginBottom: '-1px' }} />
            <h2
              className="m-0"
              style={{ fontSize: '22px', fontWeight: 700, color: '#1C1917', letterSpacing: '-0.3px' }}
            >
              College Power Rankings
            </h2>
          </div>
          <p className="m-0" style={{ fontSize: '13px', fontWeight: 400, color: '#78716C', marginTop: '3px', marginLeft: '24px' }}>
            Who's producing the strongest tour talent?
          </p>
        </div>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="flex items-center gap-0.5 group transition-all duration-300 bg-transparent border-none cursor-pointer"
          style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}
        >
          View All
          <ChevronRight size={12} className="opacity-60" />
        </button>
      </motion.div>

      {/* Hairline divider */}
      <div className="mx-4 mb-3" style={{ borderBottom: '1px solid hsl(var(--border) / 0.1)' }} />

      {/* NARRATIVE STRIP */}
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

      {/* THE CHASERS (#2 & #3) — stacked vertically */}
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
          <div className="flex flex-col" style={{ gap: '12px' }}>
            {chasers.map((s, idx) => (
              <ChaserCard
                key={s.id}
                stats={s}
                media={collegeMap?.get(s.normalized_name)}
                rank={idx + 2}
                leaderStats={topCollege}
                alumni={alumniMap?.get(s.normalized_name) || []}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA — same style as Performance Rankings ViewAllFooter */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="w-full flex items-center justify-center transition-all duration-300 hover:scale-[1.01] active:scale-[0.97]"
          style={{
            padding: '12px',
            background: AMBER.bgLight,
            border: `1px solid ${AMBER.border}`,
            borderRadius: '12px',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = AMBER.bgMedium;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = AMBER.bgLight;
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: AMBER.primary }}>
            View Full College Rankings
          </span>
          <ChevronRight size={14} style={{ color: AMBER.primary }} />
        </button>
      </div>
    </section>
  );
}
