import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type GolfReactionType = 'heart' | 'fire' | 'flag' | 'eagle' | 'birdie' | 'clap';

export interface GolfReaction {
  type: GolfReactionType;
  emoji: string;
  label: string;
}

export const GOLF_REACTIONS: GolfReaction[] = [
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'flag', emoji: '⛳', label: 'Nice shot' },
  { type: 'eagle', emoji: '🦅', label: 'Eagle' },
  { type: 'birdie', emoji: '🐦', label: 'Birdie' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
];

interface GolfReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reaction: GolfReactionType) => void;
  selectedReactions?: GolfReactionType[];
  position?: { x: number; y: number };
  isDark?: boolean;
}

export function GolfReactionPicker({
  isOpen,
  onClose,
  onSelect,
  selectedReactions = [],
  position,
  isDark = true,
}: GolfReactionPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            onClick={onClose}
          />
          
          {/* Reaction picker bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className={cn(
              "fixed z-[61] flex items-center gap-1 px-2 py-1.5 rounded-full shadow-xl",
              isDark 
                ? "bg-zinc-800 border border-white/10" 
                : "bg-white border border-border shadow-lg"
            )}
            style={{
              left: position?.x ?? '50%',
              top: position?.y ?? '50%',
              transform: position ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
            }}
          >
            {GOLF_REACTIONS.map((reaction, index) => {
              const isSelected = selectedReactions.includes(reaction.type);
              
              return (
                <motion.button
                  key={reaction.type}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    onSelect(reaction.type);
                    onClose();
                  }}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full text-xl",
                    "transition-transform hover:scale-125 active:scale-95",
                    isSelected && "bg-primary/20 ring-2 ring-primary"
                  )}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {reaction.emoji}
                </motion.button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
