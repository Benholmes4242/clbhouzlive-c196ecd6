import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, AlertCircle, RotateCcw } from "lucide-react";
import { UploadProgressState } from "./types";

interface CreateMomentShareBarProps {
  canPost: boolean;
  uploadProgress: UploadProgressState;
  onPost: () => void;
  onRetry?: () => void;
}

export default function CreateMomentShareBar({
  canPost,
  uploadProgress,
  onPost,
  onRetry,
}: CreateMomentShareBarProps) {
  const { status, uploadedFiles, totalFiles, error } = uploadProgress;
  
  const isUploading = status === 'uploading';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  // Progress percentage
  const progressPercent = totalFiles > 0 ? Math.round((uploadedFiles / totalFiles) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar - visible during upload */}
      <AnimatePresence>
        {isUploading && totalFiles > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-white/60 tabular-nums">
                {uploadedFiles}/{totalFiles}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {isFailed && error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-[11px] text-red-300 flex-1">{error}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share button - fixed 48px height */}
      <button
        disabled={!canPost || isUploading}
        onClick={onPost}
        className="w-full rounded-xl shadow-sm font-semibold text-sm transition-all duration-200 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          height: '48px',
          background: isSuccess 
            ? 'rgba(34, 197, 94, 0.25)' 
            : 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          border: isSuccess 
            ? '1px solid rgba(34, 197, 94, 0.4)' 
            : '1px solid rgba(255, 255, 255, 0.28)',
          color: 'rgba(255, 255, 255, 0.96)'
        }}
        aria-label="Post your moment"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Publishing...</span>
          </>
        ) : isSuccess ? (
          <>
            <Check className="w-4 h-4" />
            <span>Posted ✓</span>
          </>
        ) : isFailed ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Upload Failed</span>
          </>
        ) : (
          <span>Share</span>
        )}
      </button>
    </div>
  );
}
