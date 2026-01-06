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
 * Positioned vertically on the right side to avoid overlapping the bottom panel.
 */
export const PreviewCTAButtons: React.FC<PreviewCTAButtonsProps> = ({
  shareState,
  onShare,
  onNotNow,
  onViewInClubhouse,
}) => {
  return (
    <div
      className="absolute right-4 z-50 flex flex-col space-y-3"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
      }}
    >
      {shareState === 'idle' && (
        <>
          {/* Share button - primary */}
          <button
            onClick={onShare}
            className={cn(
              "px-4 py-3 rounded-xl",
              "bg-white text-slate-900",
              "font-semibold text-sm text-center",
              "transition-all duration-200",
              "shadow-lg",
              "min-w-[140px]",
              "hover:bg-white/90 active:bg-white/80"
            )}
          >
            Share to
            <br />
            Clubhouse + Profile
          </button>
          
          {/* Not now button - secondary */}
          <button
            onClick={onNotNow}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-white/10 hover:bg-white/20",
              "text-white font-medium text-sm",
              "transition-all duration-200",
              "border border-white/20",
              "min-w-[140px]",
              "backdrop-blur-sm"
            )}
          >
            Not now
          </button>
        </>
      )}
      
      {shareState === 'posting' && (
        <div className="px-4 py-3 rounded-xl bg-white/50 text-slate-900 text-sm min-w-[140px] text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Sharing…
        </div>
      )}
      
      {shareState === 'shared' && (
        <>
          {/* Shared confirmation */}
          <div className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 min-w-[140px]">
            <Check className="w-4 h-4" />
            <span>Shared</span>
          </div>
          
          {/* Done button */}
          <button
            onClick={onNotNow}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-white/10 hover:bg-white/20",
              "text-white font-medium text-sm",
              "transition-all duration-200",
              "border border-white/20",
              "min-w-[140px]",
              "backdrop-blur-sm"
            )}
          >
            Done
          </button>
          
          {/* View in Clubhouse button */}
          <button
            onClick={onViewInClubhouse}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-white text-slate-900",
              "font-semibold text-sm",
              "transition-all duration-200",
              "flex items-center justify-center space-x-1.5",
              "min-w-[140px]",
              "hover:bg-white/90 active:bg-white/80"
            )}
          >
            <span>View in Clubhouse</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

export default PreviewCTAButtons;
