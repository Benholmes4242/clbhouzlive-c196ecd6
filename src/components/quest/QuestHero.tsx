/**
 * QuestHero - Cinematic hero section showing overall Top 100 progress
 * Phase 2: Enhanced with depth, gradients, and premium feel
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

interface QuestHeroProps {
  totalPlayed: number;
  target?: number;
  seasonLabel?: string;
  hasPremiumAccent?: boolean;
}

export const QuestHero: React.FC<QuestHeroProps> = ({
  totalPlayed,
  target = 100,
  seasonLabel,
  hasPremiumAccent = false,
}) => {
  const progressPercent = Math.min((totalPlayed / target) * 100, 100);
  const isComplete = totalPlayed >= target;

  return (
    <motion.section 
      className="relative text-center py-8 px-4 rounded-3xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.95) 100%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,1)',
        border: '1px solid rgba(31, 36, 40, 0.06)',
      }}
    >
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(210, 180, 97, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Trophy icon with premium glow */}
      <motion.div 
        className="relative flex justify-center mb-5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 m-auto w-20 h-20 rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(210, 180, 97, 0.15) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
          animate={hasPremiumAccent ? {
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, rgba(210, 180, 97, 0.15) 0%, rgba(210, 180, 97, 0.08) 100%)',
            border: '1.5px solid rgba(210, 180, 97, 0.3)',
            boxShadow: `
              0 4px 16px rgba(210, 180, 97, 0.15),
              inset 0 1px 2px rgba(255, 255, 255, 0.8),
              inset 0 -1px 2px rgba(210, 180, 97, 0.1)
            `,
          }}
        >
          <Trophy className="w-8 h-8" style={{ color: '#B8A053' }} />
          
          {/* Sparkle for premium users */}
          {hasPremiumAccent && (
            <Sparkles 
              className="absolute -top-1 -right-1 w-4 h-4" 
              style={{ color: '#D2B461' }} 
            />
          )}
        </div>
      </motion.div>

      {/* Main count display */}
      <motion.div 
        className="flex items-baseline justify-center gap-2 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span
          className="text-6xl font-bold tracking-tight"
          style={{ 
            color: 'var(--quest-text-primary)',
            textShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          {totalPlayed}
        </span>
        <span
          className="text-2xl font-medium"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          / {target}
        </span>
      </motion.div>

      {/* Label */}
      <motion.p
        className="text-sm font-medium mb-4"
        style={{ color: 'var(--quest-text-secondary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Top 100 Courses Played
      </motion.p>

      {/* Progress bar */}
      <motion.div 
        className="max-w-[200px] mx-auto"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ 
            background: 'var(--quest-track)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isComplete 
                ? 'linear-gradient(90deg, #D2B461 0%, #E8C96A 100%)'
                : 'linear-gradient(90deg, var(--quest-accent-green) 0%, #8BB37A 100%)',
              boxShadow: `0 0 8px ${isComplete ? 'rgba(210, 180, 97, 0.4)' : 'rgba(110, 146, 119, 0.3)'}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Season label */}
      {seasonLabel && (
        <motion.p
          className="text-xs mt-4 font-medium"
          style={{ color: 'var(--quest-text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {seasonLabel}
        </motion.p>
      )}
    </motion.section>
  );
};

export default QuestHero;
