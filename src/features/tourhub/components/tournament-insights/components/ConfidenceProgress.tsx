/**
 * ConfidenceProgress - Premium confidence bar
 * Gold gradient for #1 pick, blue for runners-up
 * Dark themed with glow effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ConfidenceTier } from '../types';

interface ConfidenceProgressProps {
  tier: ConfidenceTier;
  variant?: 'gold' | 'neutral';  // gold for #1 pick, neutral for runners-up
}

const tierToPercentage: Record<ConfidenceTier, number> = {
  elite: 92,
  high: 78,
  medium: 65,
};

const ConfidenceProgress: React.FC<ConfidenceProgressProps> = ({ tier, variant = 'neutral' }) => {
  const percentage = tierToPercentage[tier];
  const isGold = variant === 'gold';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span 
          className="text-[10px] font-semibold uppercase"
          style={{
            color: 'rgba(255, 255, 255, 0.35)',
            letterSpacing: '1px',
          }}
        >
          AI Confidence
        </span>
        <span 
          className="text-base font-bold font-mono"
          style={{
            color: isGold ? '#FFB800' : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {percentage}%
        </span>
      </div>
      <div 
        className="h-1 rounded-sm"
        style={{ background: 'rgba(255, 255, 255, 0.06)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          transition={{ 
            delay: 0.5, 
            duration: 1, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          viewport={{ once: true }}
          className="h-full rounded-sm"
          style={{
            background: isGold 
              ? 'linear-gradient(90deg, #FFB800 0%, #FF8C00 100%)'
              : 'rgba(52, 120, 246, 0.6)',
            boxShadow: isGold 
              ? '0 0 10px rgba(255, 184, 0, 0.3)'
              : '0 0 8px rgba(52, 120, 246, 0.3)',
          }}
        />
      </div>
    </div>
  );
};

export default ConfidenceProgress;
