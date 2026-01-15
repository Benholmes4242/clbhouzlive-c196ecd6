import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCheckProps {
  className?: string;
  color?: string;
}

/**
 * AnimatedCheck - Animated checkmark with draw-in effect
 * Used in Sort drawers, Visibility sheets, and other selection UIs
 */
export const AnimatedCheck: React.FC<AnimatedCheckProps> = ({ 
  className,
  color = "#1e293b" 
}) => (
  <motion.svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    initial="hidden"
    animate="visible"
    className={className}
  >
    <motion.path
      d="M4 10L8 14L16 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: { 
          pathLength: 1, 
          opacity: 1,
          transition: { 
            pathLength: { duration: 0.3, ease: "easeOut" },
            opacity: { duration: 0.1 }
          }
        }
      }}
    />
  </motion.svg>
);

export default AnimatedCheck;
