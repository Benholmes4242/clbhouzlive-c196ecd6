/**
 * ReactionBurst — Particle burst animation when a reaction is toggled on.
 * Shows 6 small emoji particles flying outward from the reaction button.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionBurstProps {
  emoji: string;
  isVisible: boolean;
  position?: { x: number; y: number };
}

const PARTICLE_COUNT = 6;
const angles = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i / PARTICLE_COUNT) * 360);

export const ReactionBurst: React.FC<ReactionBurstProps> = ({ emoji, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {angles.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const distance = 20 + Math.random() * 12;
            const tx = Math.cos(rad) * distance;
            const ty = Math.sin(rad) * distance;

            return (
              <motion.span
                key={i}
                initial={{ opacity: 1, scale: 0.6, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 0.3, x: tx, y: ty }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute text-[10px]"
              >
                {emoji}
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
};
