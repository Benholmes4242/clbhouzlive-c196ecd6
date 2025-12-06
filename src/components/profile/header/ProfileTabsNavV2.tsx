import React from 'react';
import { Grid3X3, Flag, Trophy, LineChart } from 'lucide-react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { cn } from '@/lib/utils';

interface ProfileTabsNavV2Props {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string) => void;
  disabled?: boolean;
}

const TAB_ICONS: Record<string, React.ElementType> = {
  activity: Grid3X3,
  courses: Flag,
  top100: Trophy,
  stats: LineChart,
  achievements: Trophy,
};

/**
 * ProfileTabsNavV2 - Segmented control with icons per spec
 * Floating with shadow
 * Radius: 16px
 * Active: Bold, white text, elevated highlight
 * Inactive: Grey text, transparent
 */
const ProfileTabsNavV2: React.FC<ProfileTabsNavV2Props> = ({
  userType,
  activeSection,
  onTabChange,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);

  return (
    <section className="mt-6 px-4">
      <div 
        className={cn(
          "flex items-center justify-around",
          "rounded-[16px]",
          "bg-white/[0.06] border border-white/[0.08]",
          "p-1",
          "shadow-lg"
        )}
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeSection;
          const Icon = TAB_ICONS[tab.id] || Grid3X3;
          
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onTabChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'rounded-[12px] py-2.5 px-3',
                'text-sm font-medium',
                'transition-all duration-200',
                isActive
                  ? 'bg-white/[0.12] text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              <Icon className={cn(
                'w-4 h-4',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileTabsNavV2;
