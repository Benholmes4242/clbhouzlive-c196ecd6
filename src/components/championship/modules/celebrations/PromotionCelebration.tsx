import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, ChevronUp, Sparkles } from 'lucide-react';
import type { DivisionConfig } from '@/types/championship';

interface PromotionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  fromDivision: DivisionConfig;
  toDivision: DivisionConfig;
  newRank?: number;
}

/**
 * PromotionCelebration - Full-screen celebration modal for division promotions.
 * Features confetti, glow effects, and animated division badge.
 */
export function PromotionCelebration({ 
  isOpen, 
  onClose, 
  fromDivision, 
  toDivision,
  newRank 
}: PromotionCelebrationProps) {
  
  const fireConfetti = useCallback(() => {
    // Fire confetti from multiple angles
    const colors = [toDivision.color_hex, '#FFD700', '#FFFFFF'];
    
    // Left side
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    
    // Right side
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    // Center burst after a small delay
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors,
      });
    }, 250);
  }, [toDivision.color_hex]);

  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen, fireConfetti]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          {/* Backdrop with radial glow */}
          <div 
            className="absolute inset-0 bg-black/80"
            style={{
              background: `radial-gradient(circle at center, ${toDivision.color_hex}30 0%, rgba(0,0,0,0.9) 70%)`
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 text-center max-w-sm"
          >
            {/* Sparkles decoration */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(6)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-4 h-4 text-yellow-400 opacity-60"
                  style={{
                    top: `${10 + Math.random() * 80}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                />
              ))}
            </motion.div>

            {/* "PROMOTED" header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <ChevronUp className="w-6 h-6 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest">
                Promoted
              </span>
              <ChevronUp className="w-6 h-6 text-emerald-400" />
            </motion.div>

            {/* Division badge with glow */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', damping: 15 }}
              className="relative mx-auto w-32 h-32 mb-6"
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    `0 0 30px 10px ${toDivision.color_hex}40`,
                    `0 0 60px 20px ${toDivision.color_hex}60`,
                    `0 0 30px 10px ${toDivision.color_hex}40`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Badge circle */}
              <div 
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: `${toDivision.color_hex}20`,
                  border: `4px solid ${toDivision.color_hex}`,
                }}
              >
                <Trophy 
                  className="w-14 h-14" 
                  style={{ color: toDivision.color_hex }} 
                />
              </div>
            </motion.div>

            {/* Division name */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-white mb-2"
              style={{ textShadow: `0 0 20px ${toDivision.color_hex}` }}
            >
              {toDivision.name}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 mb-2"
            >
              You've been promoted from {fromDivision.name}
            </motion.p>

            {/* New rank */}
            {newRank && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 text-yellow-400"
              >
                <Star className="w-4 h-4" />
                <span className="font-semibold">New Rank: #{newRank}</span>
                <Star className="w-4 h-4" />
              </motion.div>
            )}

            {/* Continue button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onClose}
              className={cn(
                'mt-8 px-8 py-3 rounded-full font-semibold',
                'bg-white text-gray-900',
                'hover:bg-white/90 transition-colors'
              )}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
