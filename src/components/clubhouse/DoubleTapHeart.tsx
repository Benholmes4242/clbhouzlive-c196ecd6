/**
 * DoubleTapHeart - Large heart animation on double-tap like (TikTok-style)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface DoubleTapHeartProps {
  isVisible: boolean;
  x?: number;
  y?: number;
}

export const DoubleTapHeart: React.FC<DoubleTapHeartProps> = ({
  isVisible,
  x = 50,
  y = 50,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: 0.6,
            times: [0, 0.3, 0.5, 1],
            ease: 'easeOut',
          }}
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Heart 
            className="w-20 h-20 text-white drop-shadow-2xl" 
            fill="white"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DoubleTapHeart;
