import React from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav - Matches Explore page tabs styling exactly
 * Uses same Radix Tabs components as CoursesContent
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);

  return (
    <section className="mt-5 flex justify-center">
      <Tabs value={activeSection} onValueChange={onTabChange} className="w-full max-w-md">
        <TabsList 
          className={cn(
            "grid w-full rounded-sq-md bg-muted/70 border border-border/60 px-2 py-[3px]",
            tabs.length === 4 && "grid-cols-4",
            tabs.length === 3 && "grid-cols-3",
            tabs.length === 2 && "grid-cols-2",
            tabs.length === 1 && "grid-cols-1",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={disabled}
              className="rounded-sq-pill text-sm px-3 py-[6px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-150 ease-out"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </section>
  );
};

export default ProfileTabsNav;