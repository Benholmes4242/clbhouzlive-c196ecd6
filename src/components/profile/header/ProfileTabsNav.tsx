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

  return (
    <section 
      className="mt-6 px-4"
      onPointerDown={handlePointerDown}
    >
      <Tabs value={activeSection} onValueChange={handleValueChange} className="w-full">
        <TabsList 
          className="profile-tabs-container grid w-full"
          style={{ 
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
          }}
        >
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id}
              disabled={disabled}
              className="rounded-full text-sm px-3 py-[6px] font-medium transition-all duration-motion-fast ease-standard disabled:pointer-events-none disabled:opacity-50 data-[state=active]:profile-tab-active data-[state=inactive]:profile-tab-inactive"
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
