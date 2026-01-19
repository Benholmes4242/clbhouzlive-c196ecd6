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
        "fixed left-0 right-0 z-30 flex items-center justify-center pointer-events-none",
        className
      )}
      style={{ 
        top: 'calc(env(safe-area-inset-top) + 16px)',
        paddingRight: '100px', // Account for search + profile on right
      }}
    >
      <div className="flex items-center gap-4 pointer-events-auto">
        <button
          onClick={() => onTabChange('foryou')}
          className={cn(
            "text-base font-semibold transition-all duration-200",
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
            "text-base font-semibold transition-all duration-200",
            activeTab === 'friends' 
              ? "text-white" 
              : "text-white/50"
          )}
        >
          Yours
        </button>
      </div>
    </div>
  );
};
