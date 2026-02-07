import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PickerLoadingBannerProps {
  isVisible: boolean;
}

/**
 * PickerLoadingBanner - Compact non-blocking banner for iCloud media downloads
 * 
 * Shows "Loading media from your library..." with an indeterminate progress bar.
 * After 5 seconds, reveals an iCloud hint for large video downloads.
 * Sits above existing content without blocking interaction.
 */
export function PickerLoadingBanner({ isVisible }: PickerLoadingBannerProps) {
  const [showICloudHint, setShowICloudHint] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setShowICloudHint(false);
      return;
    }

    const timer = setTimeout(() => setShowICloudHint(true), 5000);
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
          className="absolute top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-2.5"
        >
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-medium text-foreground">
              Loading media from your library…
            </p>
            {/* Indeterminate progress bar */}
            <div className="w-full max-w-[200px] h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary w-1/3"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <AnimatePresence>
              {showICloudHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[10px] text-muted-foreground text-center"
                >
                  Large videos from iCloud may take a few minutes
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PickerLoadingBanner;
