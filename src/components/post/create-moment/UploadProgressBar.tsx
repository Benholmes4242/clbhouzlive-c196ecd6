import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressBarProps {
  /** Whether upload is currently in progress */
  isUploading: boolean;
  /** Number of files uploaded so far */
  uploadedCount: number;
  /** Total number of files to upload */
  totalCount: number;
  /** Optional className */
  className?: string;
}

/**
 * UploadProgressBar - Linear progress bar shown during upload
 * 
 * Displays "Uploading X of Y…" with animated fill
 */
export function UploadProgressBar({
  isUploading,
  uploadedCount,
  totalCount,
  className,
}: UploadProgressBarProps) {
  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  return (
    <AnimatePresence>
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "px-4 py-2 bg-slate-50 border-b border-slate-200",
            className
          )}
        >
          {/* Text label */}
          <div className="flex items-center gap-2 mb-1.5">
            <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            <span className="text-xs font-medium text-slate-600">
              Uploading {uploadedCount + 1} of {totalCount}…
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UploadProgressBar;
