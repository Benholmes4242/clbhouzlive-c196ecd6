/**
 * EchoThinkingCard - Shimmer loading state
 * Shows "Echo is thinking..." with animated shimmer lines
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { HUB_CARD, ECHO_ORANGE } from './echoStyles';
import { cn } from '@/lib/utils';

export function EchoThinkingCard() {
  return (
    <div className="flex gap-2.5">
      {/* Echo avatar with pulse animation */}
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ 
          background: `linear-gradient(145deg, ${ECHO_ORANGE}20 0%, ${ECHO_ORANGE}10 100%)`,
          border: `1.5px solid ${ECHO_ORANGE}28`,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: ECHO_ORANGE }} />
        </motion.div>
      </div>

      {/* Thinking card */}
      <div 
        className={cn(
          "flex-1 rounded-2xl rounded-tl-md px-4 py-3.5",
          HUB_CARD
        )}
      >
        {/* Shimmer lines with staggered animation */}
        <div className="space-y-2.5">
          {[85, 65, 45].map((width, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              }}
              className="h-3 rounded-full"
              style={{ 
                width: `${width}%`,
                background: `linear-gradient(90deg, ${ECHO_ORANGE}12 0%, ${ECHO_ORANGE}20 50%, ${ECHO_ORANGE}12 100%)`,
              }}
            />
          ))}
        </div>
        
        {/* Label with animated dot */}
        <div className="flex items-center gap-2 mt-3 text-[12px] font-medium" style={{ color: ECHO_ORANGE }}>
          <motion.span 
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ECHO_ORANGE }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
          Echo is thinking…
        </div>
      </div>
    </div>
  );
}
