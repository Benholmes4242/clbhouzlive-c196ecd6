import React, { useRef, useEffect, useState } from 'react';
import { SURFACE } from '@/features/courses/_shared/tokens';

type CoursesTab = 'explore' | 'top100' | 'discover';

interface TabDef {
  id: CoursesTab;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'explore', label: 'Courses' },
  { id: 'top100', label: 'Top 100' },
];

interface CoursesShellTabsProps {
  activeTab: CoursesTab;
  onTabChange: (tab: CoursesTab) => void;
}

/**
 * CoursesShellTabs — Canonical 3-destination tab strip for /courses.
 * Mirrors TourHubShellTabs spec: light #F8FAFC surface, 44px tall, 14px
 * Geist text, weight 600/700, label-width 1.5px #0A0E14 underline.
 */
export const CoursesShellTabs: React.FC<CoursesShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleTap = (id: CoursesTab, btn: HTMLButtonElement | null) => {
    onTabChange(id);
    if (btn) {
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`[data-courses-tabs]::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={scrollerRef}
        data-courses-tabs
        role="tablist"
        aria-label="Courses Sections"
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          background: '#F8FAFC',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
          overflowY: 'hidden',
          fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={(e) => handleTap(tab.id, e.currentTarget)}
              className="active:opacity-70 transition-opacity"
              style={{
                flex: '0 0 auto',
                height: 44,
                padding: '0 4px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#0A0E14' : '#64748B',
                background: 'transparent',
                border: 'none',
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'inline-block' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default CoursesShellTabs;
