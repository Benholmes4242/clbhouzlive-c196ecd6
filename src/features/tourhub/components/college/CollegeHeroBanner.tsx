import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getCollegeGradientCSS } from '../../config/collegeBrandColors';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface CollegeHeroBannerProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
}

export function CollegeHeroBanner({ stats, college }: CollegeHeroBannerProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);
  const gradientCSS = getCollegeGradientCSS(stats.normalized_name);

  const formattedEarnings = stats.earnings_total >= 1_000_000
    ? `$${(stats.earnings_total / 1_000_000).toFixed(1)}M`
    : `$${(stats.earnings_total / 1_000).toFixed(0)}K`;

  return (
    <div className="relative overflow-hidden" style={{ height: '38dvh', minHeight: 260 }}>
      {/* Brand gradient background */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 15, ease: 'easeOut' }}
        style={{ background: gradientCSS || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--foreground)))' }}
      />

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
        }}
      />

      {/* Bottom gradient for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 40%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-6">
        {/* #1 badge */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: 'rgba(245, 158, 11, 0.9)',
            marginBottom: 8,
          }}
        >
          #1 College Program
        </motion.span>

        {/* Logo */}
        {logoUrl && (
          <motion.img
            src={logoUrl}
            alt={displayName}
            className="object-contain"
            style={{ width: 96, height: 96, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))', marginBottom: 12 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          />
        )}

        {/* Name */}
        <motion.h2
          className="text-white text-center"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {displayName}
        </motion.h2>

        {/* Quick stat line */}
        <motion.p
          style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {formattedEarnings} · {stats.wins_total} wins · {stats.player_count} alumni
        </motion.p>
      </div>
    </div>
  );
}
