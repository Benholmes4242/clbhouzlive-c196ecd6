import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  delay?: number; // Delay before showing to prevent flicker
}

/**
 * Full-screen loading overlay
 * Shows spinner after delay to prevent flicker on fast operations
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = 'Loading...',
  delay = 300,
}) => {
  const [showDelayed, setShowDelayed] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (show) {
      timeout = setTimeout(() => setShowDelayed(true), delay);
    } else {
      setShowDelayed(false);
    }

    return () => clearTimeout(timeout);
  }, [show, delay]);

  return (
    <AnimatePresence>
      {showDelayed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="text-white/70 text-sm font-medium">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
