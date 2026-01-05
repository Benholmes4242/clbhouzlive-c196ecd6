import React, { useRef } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string, scrollSnapshot?: number) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav - Matches SegmentedTabs styling from Explore page
 * Captures scroll position at click time before any state changes
 */
const ProfileTabsNav: React.FC<ProfileTabsNavProps> = ({
  userType,
  activeSection,
  onTabChange,
  isMobile,
  disabled = false
}) => {
  const tabs = getProfileTabs(userType);
  const scrollSnapshotRef = useRef<number>(0);

  // Capture scroll position on mousedown/touchstart (before click completes)
  const handlePointerDown = () => {
    scrollSnapshotRef.current = window.scrollY;
  };

  // Pass captured scroll snapshot when tab changes
  const handleValueChange = (newTabId: string) => {
    onTabChange(newTabId, scrollSnapshotRef.current);
  };

  // Tab trigger class matching Top100Hub/Discover pages exactly
  const tabTriggerClass = "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50";

  return (
    <section 
      className="mt-6 sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/30"
      onPointerDown={handlePointerDown}
    >
      <div className="px-4">
        <Tabs value={activeSection} onValueChange={handleValueChange} className="w-full">
          <TabsList 
            className="grid w-full bg-transparent border-0 px-0 py-0 gap-0"
            style={{ 
              gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
            }}
          >
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                disabled={disabled}
                className={tabTriggerClass}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
};

export default ProfileTabsNav;
