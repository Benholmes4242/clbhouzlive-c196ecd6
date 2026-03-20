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
      <div style={{ borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 20, justifyContent: 'center' }}>
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
                background: 'none',
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                padding: '11px 2px 9px',
                fontSize: 16,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                letterSpacing: isActive ? '-0.025em' : '0',
                position: 'relative',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                opacity: disabled ? 0.5 : 1,
                transition: 'color 0.18s',
              }}
            >
              {tab.label}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileTabsNav;
