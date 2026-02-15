import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PickerLoadingBannerProps {
  isVisible: boolean;
}

/**
 * PickerLoadingBanner - Skeleton filmstrip shimmer for media loading
 * Shows 4-5 skeleton rectangles with shimmer animation.
 * iCloud warning only appears after 3 seconds.
 */
export function PickerLoadingBanner({ isVisible }: PickerLoadingBannerProps) {
  const [showICloudHint, setShowICloudHint] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setShowICloudHint(false);
      return;
    }

    const timer = setTimeout(() => setShowICloudHint(true), 3000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute top-0 left-0 right-0 z-40 px-4 py-3 flex flex-col items-center"
        >
          {/* Skeleton filmstrip */}
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <AnimatePresence>
            {showICloudHint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-gray-400 text-center mt-2"
              >
                Large videos from iCloud may take a few minutes
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PickerLoadingBanner;
