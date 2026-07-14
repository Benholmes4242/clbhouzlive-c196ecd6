import React, { useRef } from 'react';
import { getProfileTabs } from '@/hooks/useProfileType';
import { cn } from '@/lib/utils';

interface ProfileTabsNavProps {
  userType: string | null | undefined;
  activeSection: string;
  onTabChange: (tabId: string, scrollSnapshot?: number) => void;
  isMobile: boolean;
  disabled?: boolean;
}

/**
 * ProfileTabsNav — Pinpoint main tab (typographic underline)
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
                borderRadius: 999,
                border: 'none',
                background: isActive ? '#15171F' : 'transparent',
                color: isActive ? '#FFFFFF' : 'rgba(15,23,42,0.65)',
                fontSize: 13,
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
