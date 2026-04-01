/**
 * EchoPendingState - Dark loading state while prompt is being processed
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';

interface EchoPendingStateProps {
  prompt: string;
}

export function EchoPendingState({ prompt }: EchoPendingStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pb-32">
      {/* Amber pulsing orb */}
      <div className="mb-6">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, rgba(247,147,30,0.18) 0%, transparent 70%)' }}
          >
            <AnimatedEchoWave size={28} active={true} />
          </div>
        </motion.div>
      </div>

      {/* Prompt preview */}
      <div
        className="px-5 py-4 rounded-2xl max-w-[300px]"
        style={{
          background: '#161618',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p className="text-[14px] text-center line-clamp-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
          "{prompt}"
        </p>
      </div>

      <p className="mt-4 text-[13px] text-center" style={{ color: 'rgba(255,255,255,0.30)' }}>
        Echo is thinking…
      </p>
    </div>
  );
}