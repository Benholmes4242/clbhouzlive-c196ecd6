import React, { useRef } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SCOPE_PILL_RADIUS } from '@/components/explore-tab-new/courseled/tokens';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string, scrollSnapshot?: number) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav — the profile's selected control. Geometry and both states are
 * taken from the shipped Discover scope pills (PillFilterRow): 8px radius,
 * 1px edge, A.INK fill when selected, A.PANEL when not. Only the 36px tap
 * floor and the disabled state are local — the pills have neither.
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

  const handlePointerDown = () => {
    scrollSnapshotRef.current = window.scrollY;
  };

  const handleTabClick = (tabId: string) => {
    if (disabled) return;
    onTabChange(tabId, scrollSnapshotRef.current);
  };

  return (
    <section className="px-4 bg-background" onPointerDown={handlePointerDown}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '10px 0' }}>
        {tabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              disabled={disabled}
              style={{
                cursor: disabled ? 'default' : 'pointer',
                padding: '8px 14px',
                borderRadius: SCOPE_PILL_RADIUS,
                border: `1px solid ${isActive ? A.INK : A.BORDER}`,
                background: isActive ? A.INK : A.PANEL,
                color: isActive ? A.PANEL : A.INK,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '0.01em',
                minHeight: 36,
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileTabsNav;
