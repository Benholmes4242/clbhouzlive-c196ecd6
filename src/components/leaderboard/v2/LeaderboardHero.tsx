/**
 * LeaderboardHero - Simple centered header on page background
 * Trophy icon, title and subtitle - no card background
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
      className="w-full py-4 px-4"
    >
      {/* Content - centered */}
      <div className="flex flex-col items-center gap-2">
        {/* Season label (optional) */}
        {seasonLabel && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500/70"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {seasonLabel}
          </motion.span>
        )}
        
        {/* Title row - centered */}
        <div className="flex items-center gap-2.5 justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <Trophy className="w-5 h-5 text-amber-500" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-lg font-bold text-foreground tracking-tight"
          >
            {title}
          </motion.h1>
        </div>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground text-center max-w-[300px]"
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
}
