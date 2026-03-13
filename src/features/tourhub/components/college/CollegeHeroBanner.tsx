/**
 * CollegeHeroBanner - Hero banner for the College Golf Hub page
 * Shows the #1 ranked college with gradient background, logo, and key stats.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Trophy, ChevronRight } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { getCollegeGradientCSS } from '../../config/collegeBrandColors';
import { useTourSeason } from '../../hooks/useTourHubData';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function CollegeHeroBanner() {
  const { data: allStats, isLoading } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();

  const topCollege = useMemo(() => {
    if (!allStats?.length) return null;
    return [...allStats].sort((a, b) => b.earnings_total - a.earnings_total)[0];
  }, [allStats]);

  const college = topCollege ? collegeMap?.get(topCollege.normalized_name) ?? null : null;
  const displayName = college?.short_name || college?.college_name || topCollege?.normalized_name || '';
  const gradientCSS = topCollege ? getCollegeGradientCSS(topCollege.normalized_name) : null;
  const logoUrl = college ? getCollegeLogoUrl(college.college_name) : null;

  if (isLoading) {
    return (
      <div className="relative overflow-hidden" style={{ height: 220, borderRadius: 20 }}>
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </div>
    );
  }

  if (!topCollege) return null;

  return (
    <Link
      to={`/tourhub/college-golf/${topCollege.normalized_name}`}
      className="block relative overflow-hidden active:scale-[0.98] transition-transform"
      style={{ borderRadius: 20 }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: gradientCSS || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--foreground)))',
        }}
      />

      {/* Light texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)',
        }}
      />

      {/* Bottom gradient for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-end justify-between p-5" style={{ minHeight: 200 }}>
        {/* Left: text */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5" style={{ color: 'rgba(245, 158, 11, 0.9)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'rgba(245, 158, 11, 0.9)',
              }}
            >
              #1 Franchise · {seasonYear}
            </span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-white"
            style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.15, marginBottom: 6 }}
          >
            {displayName}
          </motion.h2>

          <div className="flex items-center gap-3">
            <span className="text-white/70" style={{ fontSize: 13, fontWeight: 500 }}>
              {formatCurrency(topCollege.earnings_total)}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/70" style={{ fontSize: 13, fontWeight: 500 }}>
              {topCollege.wins_total} {topCollege.wins_total === 1 ? 'win' : 'wins'}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/70" style={{ fontSize: 13, fontWeight: 500 }}>
              {topCollege.player_count} alumni
            </span>
          </div>

          <div className="flex items-center gap-1 mt-2">
            <span className="text-white/50" style={{ fontSize: 12, fontWeight: 500 }}>
              View profile
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
          </div>
        </div>

        {/* Right: logo */}
        {logoUrl && (
          <motion.img
            src={logoUrl}
            alt={displayName}
            className="object-contain flex-shrink-0"
            style={{
              width: 80,
              height: 80,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          />
        )}
      </div>
    </Link>
  );
}
