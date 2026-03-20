/**
 * EchoPendingState - Minimal loading state while prompt is being processed
 */

import React from 'react';
import { motion } from 'framer-motion';

interface EchoPendingStateProps {
  prompt: string;
}

export function EchoPendingState({ prompt }: EchoPendingStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pb-32">
      {/* Thinking dots */}
      <div className="flex items-center gap-[6px] mb-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Prompt preview */}
      <div
        className="px-5 py-4 rounded-2xl border max-w-[300px]"
        style={{
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <p className="text-[14px] text-foreground text-center line-clamp-2">
          "{prompt}"
        </p>
      </div>

      <p className="mt-4 text-[13px] text-muted-foreground text-center">
        Echo is thinking...
      </p>
    </div>
  );
}
