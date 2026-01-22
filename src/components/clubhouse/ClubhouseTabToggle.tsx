import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
}

/**
 * Tab toggle for Clubhouse feed - now rendered inside CompactHeader
 * Uses flex layout for automatic centering, no JS measurements needed
 */
export const ClubhouseTabToggle = ({
  activeTab,
  onTabChange,
  className,
}: ClubhouseTabToggleProps) => {
  return (
    <div className={cn("flex items-center gap-2 -ml-12 relative z-[45]", className)}>
      <button
        onClick={() => onTabChange('foryou')}
        className={cn(
          "text-xs font-medium transition-opacity duration-200 whitespace-nowrap",
          activeTab === 'foryou' 
            ? "text-white opacity-100" 
            : "text-white opacity-50"
        )}
      >
        Suggested
      </button>
      <span className="text-white opacity-30 text-xs font-light">|</span>
      <button
        onClick={() => onTabChange('friends')}
        className={cn(
          "text-xs font-medium transition-opacity duration-200 whitespace-nowrap",
          activeTab === 'friends' 
            ? "text-white opacity-100" 
            : "text-white opacity-50"
        )}
      >
        Friends
      </button>
    </div>
  );
};
