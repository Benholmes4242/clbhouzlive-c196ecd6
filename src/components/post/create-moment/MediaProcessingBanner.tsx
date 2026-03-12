import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface MediaProcessingBannerProps {
  totalVideos: number;
  completedVideos: number;
}

/**
 * MediaProcessingBanner - Non-blocking inline progress indicator
 * 
 * Shows "Processing X of Y videos..." with a progress bar while videos are
 * being processed (duration extraction, poster generation). When all complete,
 * briefly shows "✓ All media ready" then fades out.
 */
export function MediaProcessingBanner({ totalVideos, completedVideos }: MediaProcessingBannerProps) {
  const isProcessing = totalVideos > 0 && completedVideos < totalVideos;
  const [showComplete, setShowComplete] = useState(false);

  // Show "All media ready" briefly when processing completes
  useEffect(() => {
    if (totalVideos > 0 && completedVideos >= totalVideos) {
      setShowComplete(true);
      const timer = setTimeout(() => setShowComplete(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [totalVideos, completedVideos]);

  // Reset when a new batch starts
  useEffect(() => {
    if (isProcessing) {
      setShowComplete(false);
    }
  }, [isProcessing]);

  if (!isProcessing && !showComplete) return null;

  const progress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-2"
      >
        {isProcessing ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground text-center">
              Processing {completedVideos + 1} of {totalVideos} video{totalVideos !== 1 ? 's' : ''}…
            </p>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ) : showComplete ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-xs text-emerald-600 font-medium">All media ready</p>
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

export default MediaProcessingBanner;
