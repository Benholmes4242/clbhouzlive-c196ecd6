import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ShareState = 'idle' | 'posting' | 'shared';

interface PreviewCTAButtonsProps {
  shareState: ShareState;
  onShare: () => void;
  onNotNow: () => void;
  onViewInClubhouse: () => void;
}

// Respect reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

/**
 * Preview CTA buttons component for post-rating confirmation screen.
 * Positioned horizontally in the safe area.
 */
export const PreviewCTAButtons: React.FC<PreviewCTAButtonsProps> = ({
  shareState,
  onShare,
  onNotNow,
  onViewInClubhouse,
}) => {
  return (
    <motion.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut', delay: 0.25 }}
      className="absolute left-0 right-0 z-50 flex px-4 space-x-3"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      }}
    >
      <AnimatePresence mode="wait">
        {shareState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 space-x-3"
          >
            {/* Not now - subtle */}
            <button
              onClick={onNotNow}
              className={cn(
                "flex-[0.3] py-3 rounded-xl",
                "bg-white/10 hover:bg-white/20",
                "text-white/80 font-medium text-sm",
                "transition-all duration-200",
                "border border-white/20",
                "backdrop-blur-sm",
                "active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              Not now
            </button>
            
            {/* Share - prominent */}
            <button
              onClick={onShare}
              className={cn(
                "flex-[0.7] py-3.5 rounded-xl",
                "bg-white text-slate-900",
                "font-semibold text-sm text-center",
                "transition-all duration-200",
                "shadow-lg shadow-black/20",
                "hover:bg-gray-100",
                "active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              Share to Clubhouse + Profile
            </button>
          </motion.div>
        )}
        
        {shareState === 'posting' && (
          <motion.div
            key="posting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex-1 py-3.5 rounded-xl bg-white/50 backdrop-blur-sm text-slate-900 text-sm text-center flex items-center justify-center gap-2"
          >
            {/* Premium loading spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full"
            />
            <span className="font-medium">Sharing...</span>
          </motion.div>
        )}
        
        {shareState === 'shared' && (
          <motion.div
            key="shared"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 space-x-3"
          >
            {/* Shared confirmation with animated checkmark */}
            <div className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30">
              <motion.div
                initial={{ scale: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 1 : 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
              <span>Shared</span>
            </div>
            
            {/* Done */}
            <button
              onClick={onNotNow}
              className={cn(
                "flex-1 py-3 rounded-xl",
                "bg-white/10 hover:bg-white/20",
                "text-white font-medium text-sm",
                "transition-all duration-200",
                "border border-white/20",
                "backdrop-blur-sm",
                "active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              Done
            </button>
            
            {/* View in Clubhouse */}
            <button
              onClick={onViewInClubhouse}
              className={cn(
                "flex-1 py-3 rounded-xl",
                "bg-white text-slate-900",
                "font-semibold text-sm",
                "transition-all duration-200",
                "flex items-center justify-center space-x-1.5",
                "shadow-lg shadow-black/20",
                "hover:bg-gray-100",
                "active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <span>View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PreviewCTAButtons;
