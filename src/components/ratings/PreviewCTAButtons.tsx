import React from 'react';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShareState = 'idle' | 'posting' | 'shared';

interface PreviewCTAButtonsProps {
  shareState: ShareState;
  onShare: () => void;
  onNotNow: () => void;
  onViewInClubhouse: () => void;
}

/**
 * Preview CTA buttons component for post-rating confirmation screen.
 * Positioned horizontally below the ReviewBottomPanel in the safe area.
 */
export const PreviewCTAButtons: React.FC<PreviewCTAButtonsProps> = ({
  shareState,
  onShare,
  onNotNow,
  onViewInClubhouse,
}) => {
  return (
    <div
      className="absolute left-0 right-0 z-50 flex px-4 space-x-3"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      {shareState === 'idle' && (
        <>
          {/* Not now - 30% width */}
          <button
            onClick={onNotNow}
            className={cn(
              "flex-[0.3] py-3 rounded-xl",
              "bg-white/10 hover:bg-white/20",
              "text-white font-medium text-sm",
              "transition-all duration-200",
              "border border-white/20",
              "backdrop-blur-sm"
            )}
          >
            Not now
          </button>
          
          {/* Share - 70% width */}
          <button
            onClick={onShare}
            className={cn(
              "flex-[0.7] py-3 rounded-xl",
              "bg-white text-slate-900",
              "font-semibold text-sm text-center",
              "transition-all duration-200",
              "shadow-lg",
              "hover:bg-white/90 active:bg-white/80"
            )}
          >
            Share to Clubhouse + Profile
          </button>
        </>
      )}
      
      {shareState === 'posting' && (
        <div className="flex-1 py-3 rounded-xl bg-white/50 text-slate-900 text-sm text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Sharing…
        </div>
      )}
      
      {shareState === 'shared' && (
        <>
          {/* Shared confirmation - 33% */}
          <div className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Shared</span>
          </div>
          
          {/* Done - 33% */}
          <button
            onClick={onNotNow}
            className={cn(
              "flex-1 py-3 rounded-xl",
              "bg-white/10 hover:bg-white/20",
              "text-white font-medium text-sm",
              "transition-all duration-200",
              "border border-white/20",
              "backdrop-blur-sm"
            )}
          >
            Done
          </button>
          
          {/* View in Clubhouse - 33% */}
          <button
            onClick={onViewInClubhouse}
            className={cn(
              "flex-1 py-3 rounded-xl",
              "bg-white text-slate-900",
              "font-semibold text-sm",
              "transition-all duration-200",
              "flex items-center justify-center space-x-1.5",
              "hover:bg-white/90 active:bg-white/80"
            )}
          >
            <span>View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

export default PreviewCTAButtons;
