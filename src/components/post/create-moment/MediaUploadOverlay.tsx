import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaUploadStatus } from '@/hooks/useSnapModal';

interface MediaUploadOverlayProps {
  status?: MediaUploadStatus;
  progress?: number; // 0-100
  className?: string;
}

/**
 * MediaUploadOverlay - Shows upload state on individual media thumbnails
 * 
 * States:
 * - pending: Dimmed with clock icon (queued for upload)
 * - uploading: Circular spinner with optional percentage
 * - complete: Green checkmark
 * - failed: Red error icon
 */
export function MediaUploadOverlay({ status, progress, className }: MediaUploadOverlayProps) {
  // No overlay if no status or undefined
  if (!status) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "absolute inset-0 flex items-center justify-center z-10 rounded-[14px]",
          status === 'pending' && "bg-black/50",
          status === 'uploading' && "bg-black/40",
          status === 'complete' && "bg-emerald-500/30",
          status === 'failed' && "bg-red-500/30",
          className
        )}
      >
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-white/80" />
          </div>
        )}

        {status === 'uploading' && (
          <div className="relative flex items-center justify-center">
            {/* Spinner */}
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            {/* Progress percentage (if available) */}
            {progress !== undefined && progress > 0 && (
              <span className="absolute text-[8px] font-bold text-white tabular-nums">
                {Math.round(progress)}
              </span>
            )}
          </div>
        )}

        {status === 'complete' && (
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default MediaUploadOverlay;
