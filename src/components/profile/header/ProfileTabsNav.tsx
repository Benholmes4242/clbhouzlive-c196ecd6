import React from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav - Matches SegmentedTabs styling from Explore page
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
    <section className="mt-6 px-4">
      <Tabs value={activeSection} onValueChange={onTabChange} className="w-full">
        <TabsList 
          className="grid w-full rounded-sq-md bg-muted/70 border border-border/60 px-2 py-[3px]"
          style={{ 
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
          }}
        >
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id}
              disabled={disabled}
              className="rounded-sq-pill text-sm px-3 py-[6px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard disabled:pointer-events-none disabled:opacity-50"
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
