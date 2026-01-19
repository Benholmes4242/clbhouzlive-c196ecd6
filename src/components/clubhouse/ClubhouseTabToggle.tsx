import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
}

/**
 * Tab toggle for Clubhouse feed - positioned on video content area
 * Uses z-10 so it sits below the header (z-header) and becomes visible when header fades
 */
export const ClubhouseTabToggle = ({ 
  activeTab, 
  onTabChange,
  className 
}: ClubhouseTabToggleProps) => {
  return (
    <div 
      className={cn(
        "absolute top-4 left-4 z-10 flex items-center gap-3",
        className
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <button
        onClick={() => onTabChange('foryou')}
        className={cn(
          "text-sm font-semibold transition-all duration-200 drop-shadow-md",
          activeTab === 'foryou' 
            ? "text-white" 
            : "text-white/50"
        )}
      >
        Suggested
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={cn(
          "text-sm font-semibold transition-all duration-200 drop-shadow-md",
          activeTab === 'friends' 
            ? "text-white" 
            : "text-white/50"
        )}
      >
        Yours
      </button>
    </div>
  );
};
