import React, { useRef } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string, scrollSnapshot?: number) => void;
  isMobile: boolean;
  disabled?: boolean;
  darkTheme?: boolean;
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
  disabled = false,
  darkTheme = false
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

  return (
    <section 
      className="mt-6 px-4"
      onPointerDown={handlePointerDown}
    >
      <Tabs value={activeSection} onValueChange={handleValueChange} className="w-full">
        <TabsList 
          className={`grid w-full rounded-sq-md border px-2 py-[3px] ${
            darkTheme 
              ? 'bg-white/4 border-white/8' 
              : 'bg-muted/70 border-border/60'
          }`}
          style={{ 
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
          }}
        >
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id}
              disabled={disabled}
              className={`rounded-sq-pill text-sm px-3 py-[6px] font-medium transition-all duration-motion-fast ease-standard disabled:pointer-events-none disabled:opacity-50 ${
                darkTheme 
                  ? 'data-[state=active]:bg-white/10 data-[state=active]:shadow-sm data-[state=active]:text-white/92 text-white/55 hover:text-white/75' 
                  : 'data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground'
              }`}
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
