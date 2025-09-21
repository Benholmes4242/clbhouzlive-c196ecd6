import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PostSuccessOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

const PostSuccessOverlay: React.FC<PostSuccessOverlayProps> = ({ 
  isVisible, 
  onComplete 
}) => {
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (isVisible) {
      // Auto-complete after 800ms
      const timer = setTimeout(() => {
        onComplete();
      }, 800);

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([50]); // Success tap
      }

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.2 }}
    >
      {/* Liquid glass overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Success card */}
      <motion.div
        className="relative rounded-3xl bg-black/60 backdrop-blur-md border border-white/20 px-8 py-6 shadow-2xl"
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          delay: 0.1
        }}
      >
        <div className="flex flex-col items-center gap-3">
          {/* Success icon with glow */}
          <motion.div
            className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center relative"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              delay: 0.2
            }}
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse" />
            <Check className="w-6 h-6 text-green-400" strokeWidth={2.5} />
          </motion.div>
          
          {/* Success text */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-white mb-1">
              Moment Posted
            </h3>
            <p className="text-sm text-white/70">
              Returning to Discover
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ARIA live region for accessibility */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Moment posted. Returning to Discover.
      </div>
    </motion.div>
  );
};

export default PostSuccessOverlay;