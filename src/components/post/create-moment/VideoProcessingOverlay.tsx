import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';

interface VideoProcessingOverlayProps {
  isProcessing?: boolean;
  hasWarning?: boolean;
}

/**
 * VideoProcessingOverlay - Shows processing/warning state on video thumbnails
 * 
 * - Processing: Semi-transparent dark overlay with centered spinner
 * - Warning: Small amber triangle badge in corner (poster generation failed but video still usable)
 */
export function VideoProcessingOverlay({ isProcessing, hasWarning }: VideoProcessingOverlayProps) {
  if (!isProcessing && !hasWarning) return null;

  return (
    <AnimatePresence mode="wait">
      {isProcessing && (
        <motion.div
          key="processing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/30"
        >
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </motion.div>
      )}
      {!isProcessing && hasWarning && (
        <motion.div
          key="warning"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute top-1 left-1 z-20"
        >
          <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VideoProcessingOverlay;
