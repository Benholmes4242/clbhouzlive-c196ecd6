import React, { useRef, useEffect, useState } from 'react';

type CourseDetailTab = 'about' | 'reviews' | 'media' | 'holes' | 'legends';

interface TabDef {
  id: CourseDetailTab;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'media', label: 'Media' },
  { id: 'holes', label: 'Holes' },
  { id: 'legends', label: 'Champions' },
];

interface CourseDetailShellTabsProps {
  activeTab: CourseDetailTab;
  onTabChange: (tab: CourseDetailTab) => void;
}

/**
 * CourseDetailShellTabs — Canonical 4-tab strip for /courses/:courseId.
 * Mirrors TourHubShellTabs / CoursesShellTabs spec: dark #0A0E14 surface,
 * 44px tall, 14px Geist text, weight 600/700, label-width 1.5px white
 * underline, tabs distributed evenly across the row.
 */
export const CourseDetailShellTabs: React.FC<CourseDetailShellTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <style>{`[data-course-detail-tabs]::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={scrollerRef}
        data-course-detail-tabs
        role="tablist"
        aria-label="Course Detail Sections"
        style={{
          display: 'flex',
          justifyContent: overflowing ? 'flex-start' : 'space-evenly',
          gap: overflowing ? 8 : 0,
          padding: overflowing ? '0 16px' : 0,
          background: '#F8FAFC',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
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
              onClick={(e) => {
                onTabChange(tab.id);
                e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
              }}
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

export default CourseDetailShellTabs;
