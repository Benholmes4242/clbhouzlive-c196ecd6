/**
 * CollegeHeroBanner - Full-bleed immersive hero for the #1 college.
 * Adapts per active leaderboard tab with AnimatePresence crossfade.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getCollegeGradientCSS } from '../../config/collegeBrandColors';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface CollegeHeroBannerProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  className?: string;
}

export function CollegeHeroBanner({ stats, college, className }: CollegeHeroBannerProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const gradientCSS = getCollegeGradientCSS(stats.normalized_name);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stats.normalized_name}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className={cn('relative overflow-hidden', className)}
        style={{ height: '45dvh' }}
      >
        {/* Background gradient with Ken Burns */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 15, ease: 'easeOut' }}
          style={{ background: gradientCSS }}
        />

        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
          }}
        />

        {/* Bottom fade for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 65%, transparent 85%)',
          }}
        />

        {/* Content */}
        <Link
          to={`/tourhub/college-golf/${stats.normalized_name}`}
          className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20"
          style={{ minHeight: '45dvh' }}
        >
          {/* Logo — 110×110 centered */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-4"
          >
            {getCollegeLogoUrl(college?.college_name || stats.normalized_name) ? (
              <img
                src={getCollegeLogoUrl(college?.college_name || stats.normalized_name)!}
                alt={displayName}
                className="object-contain"
                style={{
                  width: 140,
                  height: 140,
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                <span className="text-3xl font-bold text-white/60">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>

          {/* #1 Badge — 12px, 700, amber */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-1.5"
            style={{ marginBottom: 12 }}
          >
            <Trophy className="w-3.5 h-3.5" style={{ color: 'rgba(245, 158, 11, 0.9)' }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'rgba(245, 158, 11, 0.9)',
              }}
            >
              #1 This Season
            </span>
          </motion.div>

          {/* College Name — 34px, 700, white */}
          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="text-center"
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.4px',
              marginBottom: 4,
            }}
          >
            {displayName}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.28 }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 12,
            }}
          >
            {stats.player_count} alumni on the PGA Tour
          </motion.p>

          {/* Stats Grid — 3 cols in dark container */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-stretch mx-4"
            style={{
              background: 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '12px 0',
              width: '100%',
              maxWidth: 320,
            }}
          >
            <StatCell label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <StatCell label="WINS" value={String(stats.wins_total)} />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <StatCell label="ALUMNI" value={String(stats.player_count)} icon={<Users style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />} />
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCell({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
    <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 mt-1">
        {icon}
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'white',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
