import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, AlertCircle, RotateCcw, Image, Tag, Eye, MessageSquare } from "lucide-react";
import { UploadProgressState } from "./types";
import { triggerHaptic } from "@/lib/ui/haptics";

interface CreateMomentShareBarProps {
  canPost: boolean;
  uploadProgress: UploadProgressState;
  onPost: () => void;
  onRetry?: () => void;
  // Readiness indicators
  hasMedia?: boolean;
  hasCaption?: boolean;
  hasCategory?: boolean;
  hasVisibility?: boolean;
}

export default function CreateMomentShareBar({
  canPost,
  uploadProgress,
  onPost,
  onRetry,
  hasMedia = false,
  hasCaption = false,
  hasCategory = false,
  hasVisibility = true,
}: CreateMomentShareBarProps) {
  const { status, uploadedFiles, totalFiles, error } = uploadProgress;
  
  const isUploading = status === 'uploading';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  const [hasShownPulse, setHasShownPulse] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  // Progress percentage
  const progressPercent = totalFiles > 0 ? Math.round((uploadedFiles / totalFiles) * 100) : 0;

  // Trigger readiness pulse when all requirements are met for the first time
  useEffect(() => {
    const isReady = canPost && hasMedia && hasCategory;
    if (isReady && !hasShownPulse && !isUploading) {
      setShowPulse(true);
      setHasShownPulse(true);
      triggerHaptic('success');
      // Auto-dismiss pulse after animation
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [canPost, hasMedia, hasCategory, hasShownPulse, isUploading]);

  // Handle post with lock
  const handlePost = useCallback(() => {
    if (isLocked || !canPost || isUploading) return;
    
    // Lock button immediately
    setIsLocked(true);
    triggerHaptic('medium');
    onPost();
    
    // Reset lock after a short delay (in case of error)
    setTimeout(() => setIsLocked(false), 2000);
  }, [isLocked, canPost, isUploading, onPost]);

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

      {/* Readiness indicator - ALWAYS shown, not gated by hasMedia */}
      <div className="flex items-center justify-center gap-3 py-1">
        <ReadinessIcon active={hasMedia} icon={<Image className="w-3 h-3" />} required />
        <ReadinessIcon active={hasCaption} icon={<MessageSquare className="w-3 h-3" />} optional />
        <ReadinessIcon active={hasCategory} icon={<Tag className="w-3 h-3" />} required />
        <ReadinessIcon active={hasVisibility} icon={<Eye className="w-3 h-3" />} optional />
      </div>

      {/* Share button with readiness pulse */}
      <motion.button
        disabled={!canPost || isUploading || isLocked}
        onClick={handlePost}
        whileTap={{ scale: 0.97 }}
        animate={{
          boxShadow: showPulse 
            ? ['0 0 0 0 rgba(100, 116, 139, 0)', '0 0 0 8px rgba(100, 116, 139, 0.3)', '0 0 0 0 rgba(100, 116, 139, 0)']
            : 'none',
        }}
        transition={{ 
          boxShadow: { duration: 0.8, ease: "easeOut" },
        }}
        className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: isSuccess 
            ? 'rgba(34, 197, 94, 0.15)' 
            : canPost && !isUploading && !isLocked
              ? 'var(--cm-surface-slate)'
              : 'var(--cm-surface-alt)',
          border: isSuccess 
            ? '1px solid rgba(34, 197, 94, 0.3)' 
            : canPost && !isUploading && !isLocked
              ? 'none'
              : '1px solid var(--cm-border-subtle)',
          color: isSuccess 
            ? '#16A34A'
            : canPost && !isUploading && !isLocked
              ? 'white'
              : 'var(--cm-text-tertiary)',
          boxShadow: canPost && !isUploading && !isSuccess && !isLocked ? 'var(--cm-shadow-button)' : 'none',
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
      </motion.button>
    </div>
  );
}

// Small readiness icon component
interface ReadinessIconProps {
  active: boolean;
  icon: React.ReactNode;
  optional?: boolean;
  required?: boolean;
}

const ReadinessIcon: React.FC<ReadinessIconProps> = ({ active, icon, optional = false }) => (
  <div 
    className="flex items-center justify-center transition-colors"
    style={{ 
      color: active 
        ? 'var(--cm-surface-slate)' 
        : optional 
          ? 'var(--cm-border)' 
          : 'var(--cm-text-tertiary)',
      opacity: active ? 1 : optional ? 0.4 : 0.6,
    }}
  >
    {icon}
  </div>
);
