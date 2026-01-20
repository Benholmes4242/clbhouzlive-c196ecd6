import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
}

/**
 * Tab toggle for Clubhouse feed - fixed position on video content area
 * Uses z-30 so it sits above video but below header (z-header = 40+)
 * 
 * POSITIONING: Uses a simple left offset from center to avoid jumping.
 * Previously used dynamic calculation based on search button position
 * which caused jumps during re-renders.
 */
export const ClubhouseTabToggle = ({
  activeTab,
  onTabChange,
  className,
}: ClubhouseTabToggleProps) => {
  return (
    <div
      className={cn(
        'fixed z-30 flex items-center justify-center pointer-events-none',
        className
      )}
      style={{
        top: 'calc(env(safe-area-inset-top) + 16px)',
        // Center in viewport, then shift left by 40px for visual balance
        left: '50%',
        transform: 'translateX(calc(-50% - 40px))',
      }}
    >
      {/* Simple inline flex layout - no dynamic positioning */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => onTabChange('foryou')}
          className={cn(
            'text-sm font-semibold transition-all duration-200 whitespace-nowrap',
            activeTab === 'foryou' ? 'text-white' : 'text-white/50'
          )}
        >
          Suggested
        </button>

        <button
          onClick={() => onTabChange('friends')}
          className={cn(
            'text-sm font-semibold transition-all duration-200 whitespace-nowrap',
            activeTab === 'friends' ? 'text-white' : 'text-white/50'
          )}
        >
          Yours
        </button>
      </div>
    </div>
  );
};
