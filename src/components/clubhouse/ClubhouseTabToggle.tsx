import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
  isBusinessActor?: boolean;
}

/**
 * Tab toggle for Clubhouse feed - now rendered inside CompactHeader
 * Uses flex layout for automatic centering, no JS measurements needed
 * Hides Friends tab when in business actor mode
 */
export const ClubhouseTabToggle = ({
  activeTab,
  onTabChange,
  className,
  isBusinessActor = false,
}: ClubhouseTabToggleProps) => {
  // When in business mode, only show Suggested (no toggle needed)
  if (isBusinessActor) {
    return (
      <div className={cn("flex items-center gap-2 relative z-[45]", className)}>
        <span className="text-sm font-medium text-white opacity-100 whitespace-nowrap">
          Suggested
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 relative z-[45]", className)}>
      <button
        onClick={() => onTabChange('foryou')}
        className={cn(
          "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
          activeTab === 'foryou' 
            ? "text-white opacity-100" 
            : "text-white opacity-50"
        )}
      >
        Suggested
      </button>
      <span className="text-white opacity-30 text-sm font-light">|</span>
      <button
        onClick={() => onTabChange('friends')}
        className={cn(
          "text-sm font-medium transition-opacity duration-200 whitespace-nowrap",
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
