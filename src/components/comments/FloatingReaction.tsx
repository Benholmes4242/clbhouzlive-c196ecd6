/**
 * FloatingReaction — Emoji floats up from a comment when reacted to, 
 * drifting left/right with physics, fading out after ~1.5s.
 * For burst mode (3+ simultaneous), multiple instances are spawned.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingReactionItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface FloatingReactionProps {
  emoji: string;
  trigger: number; // increment to trigger a new float
  originY?: number;
}

export const FloatingReaction: React.FC<FloatingReactionProps> = ({ emoji, trigger, originY = 0 }) => {
  const [items, setItems] = useState<FloatingReactionItem[]>([]);

  useEffect(() => {
    if (trigger <= 0) return;
    const id = `${Date.now()}-${Math.random()}`;
    const x = (Math.random() - 0.5) * 60; // drift left/right
    setItems(prev => [...prev, { id, emoji, x, y: originY }]);
    // Auto-remove after animation
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 1600);
  }, [trigger, emoji, originY]);

  return (
    <AnimatePresence>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          animate={{ 
            opacity: 0, 
            y: -120, 
            x: item.x,
            scale: 0.6,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute bottom-0 left-1/2 pointer-events-none text-2xl z-50"
          style={{ marginLeft: -12 }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
