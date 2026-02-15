/**
 * CollegeHeroBanner - Full-bleed immersive hero for the #1 college.
 * Adapts per active leaderboard tab with AnimatePresence crossfade.
 * Ken Burns subtle animation on background.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
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
        style={{ height: 'clamp(256px, 48vh, 384px)' }}
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Content */}
        <Link
          to={`/tourhub/college-golf/${stats.normalized_name}`}
          className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20"
          style={{ minHeight: 'clamp(256px, 48vh, 384px)' }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-4"
          >
            {college?.logo_url ? (
              <img
                src={college.logo_url}
                alt={displayName}
                className="object-contain"
                style={{
                  width: '110px',
                  height: '110px',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                <span className="text-3xl font-bold text-white/60">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>

          {/* #1 Badge */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-1.5 mb-2"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              #1 This Season
            </span>
          </motion.div>

          {/* College Name */}
          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="text-2xl md:text-3xl font-bold text-white text-center tracking-tight mb-4"
          >
            {displayName}
          </motion.h1>

          {/* Stat Pills */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <StatPill label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <StatPill label="WINS" value={String(stats.wins_total)} />
            <StatPill label="ALUMNI" value={String(stats.player_count)} icon={<Users className="w-3 h-3" />} />
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

function StatPill({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 min-w-[72px]">
      <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-sm font-bold text-white font-mono tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}
