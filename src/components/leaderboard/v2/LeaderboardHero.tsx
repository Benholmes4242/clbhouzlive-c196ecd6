/**
 * LeaderboardHero - Premium header for the leaderboard
 * Cinematic charcoal surface with subtle gradient and trophy accent
 */

import React from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardHeroProps {
  title?: string;
  subtitle?: string;
  seasonLabel?: string;
}

export function LeaderboardHero({
  title = 'Top 100 Championship',
  subtitle = "Climb the rankings by playing the world's greatest courses.",
  seasonLabel,
}: LeaderboardHeroProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full overflow-hidden rounded-2xl mx-0"
      style={{
        background: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 50%, #1F1F1F 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Subtle ambient glow behind trophy */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 opacity-20 blur-2xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
      />
      
      {/* Content */}
      <div className="relative z-10 px-4 py-3.5">
        {/* Season label (optional) */}
        {seasonLabel && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400/70 mb-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {seasonLabel}
          </motion.span>
        )}
        
        {/* Title row */}
        <div className="flex items-center gap-2.5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <Trophy className="w-5 h-5 text-amber-400/80" />
            {/* Trophy glow */}
            <div className="absolute inset-0 blur-sm opacity-50">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-base font-bold text-white tracking-tight"
          >
            {title}
          </motion.h1>
        </div>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-[11px] text-white/50 mt-1.5 leading-relaxed max-w-[300px]"
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
}
