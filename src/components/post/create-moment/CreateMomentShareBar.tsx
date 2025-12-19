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
              <div 
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: 'var(--cm-border)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--cm-surface-slate)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <span 
                className="text-[10px] tabular-nums"
                style={{ color: 'var(--cm-text-tertiary)' }}
              >
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
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-[11px] text-red-600 flex-1">{error}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[11px] transition-colors"
                style={{ color: 'var(--cm-text-secondary)' }}
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share button - slate enabled, light disabled */}
      <button
        disabled={!canPost || isUploading}
        onClick={onPost}
        className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[.99] disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: isSuccess 
            ? 'rgba(34, 197, 94, 0.15)' 
            : canPost && !isUploading
              ? 'var(--cm-surface-slate)'
              : 'var(--cm-surface-alt)',
          border: isSuccess 
            ? '1px solid rgba(34, 197, 94, 0.3)' 
            : canPost && !isUploading
              ? 'none'
              : '1px solid var(--cm-border-subtle)',
          color: isSuccess 
            ? '#16A34A'
            : canPost && !isUploading
              ? 'white'
              : 'var(--cm-text-tertiary)',
          boxShadow: canPost && !isUploading && !isSuccess ? 'var(--cm-shadow-button)' : 'none',
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
