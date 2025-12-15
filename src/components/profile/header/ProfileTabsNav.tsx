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
    <div 
      className="px-4 py-2"
      onPointerDown={handlePointerDown}
    >
      <div className="flex items-center justify-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleValueChange(tab.id)}
            disabled={disabled}
            className={`
              px-4 py-2 text-sm font-medium rounded-full transition-all
              disabled:pointer-events-none disabled:opacity-50
              ${activeSection === tab.id 
                ? 'bg-[rgba(15,15,15,0.06)] text-[#1F2428]' 
                : 'text-[#5E666D] hover:bg-[rgba(0,0,0,0.03)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTabsNav;
