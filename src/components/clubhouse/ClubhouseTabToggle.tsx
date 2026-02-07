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
      <div className={cn("flex items-center gap-2 relative z-[45]", className)} role="tablist" aria-label="Feed filter">
        <span className="text-sm font-semibold text-white opacity-100 whitespace-nowrap py-3 px-1">
          Suggested
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 relative z-[45]", className)} role="tablist" aria-label="Feed filter">
      <button
        role="tab"
        aria-selected={activeTab === 'foryou'}
        onClick={() => onTabChange('foryou')}
        className={cn(
          "text-sm transition-all duration-200 whitespace-nowrap py-3 px-1 active:scale-[0.97]",
          activeTab === 'foryou' 
            ? "text-white opacity-100 font-semibold" 
            : "text-white opacity-50 font-medium"
        )}
      >
        Suggested
      </button>
      <span className="text-white opacity-40 text-sm font-light" aria-hidden="true">|</span>
      <button
        role="tab"
        aria-selected={activeTab === 'friends'}
        onClick={() => onTabChange('friends')}
        className={cn(
          "text-sm transition-all duration-200 whitespace-nowrap py-3 px-1 active:scale-[0.97]",
          activeTab === 'friends' 
            ? "text-white opacity-100 font-semibold" 
            : "text-white opacity-50 font-medium"
        )}
      >
        Friends
      </button>
    </div>
  );
};
