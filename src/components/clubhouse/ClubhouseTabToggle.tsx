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
 * Becomes more visible when header fades away
 */
export const ClubhouseTabToggle = ({ 
  activeTab, 
  onTabChange,
  className 
}: ClubhouseTabToggleProps) => {
  return (
    <div 
      className={cn(
        "fixed left-4 z-30 flex items-center gap-3 pointer-events-auto",
        className
      )}
      style={{ 
        top: 'calc(env(safe-area-inset-top) + 16px)',
      }}
    >
      <button
        onClick={() => onTabChange('foryou')}
        className={cn(
          "text-sm font-semibold transition-all duration-200",
          activeTab === 'foryou' 
            ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" 
            : "text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        )}
      >
        Suggested
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={cn(
          "text-sm font-semibold transition-all duration-200",
          activeTab === 'friends' 
            ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" 
            : "text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        )}
      >
        Yours
      </button>
    </div>
  );
};
