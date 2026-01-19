import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
}

export const ClubhouseTabToggle = ({ 
  activeTab, 
  onTabChange,
  className 
}: ClubhouseTabToggleProps) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        onClick={() => onTabChange('foryou')}
        className={cn(
          "text-base font-semibold transition-all duration-200",
          activeTab === 'foryou' 
            ? "text-white" 
            : "text-white/50 hover:text-white/70"
        )}
      >
        For You
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={cn(
          "text-base font-semibold transition-all duration-200",
          activeTab === 'friends' 
            ? "text-white" 
            : "text-white/50 hover:text-white/70"
        )}
      >
        Friends
      </button>
    </div>
  );
};
