import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INK, INK_MUTE } from '@/features/courses/_shared/tokens';


type CourseDetailTab = 'about' | 'reviews' | 'media' | 'holes' | 'legends';

interface TabDef {
  id: CourseDetailTab;
  labelKey: string;
}

const TABS: TabDef[] = [
  { id: 'about',   labelKey: 'courseDetail.tabs.about' },
  { id: 'reviews', labelKey: 'courseDetail.tabs.reviews' },
  { id: 'media',   labelKey: 'courseDetail.tabs.media' },
  { id: 'holes',   labelKey: 'courseDetail.tabs.holes' },
  { id: 'legends', labelKey: 'courseDetail.tabs.legends' },
];

interface CourseDetailShellTabsProps {
  activeTab: CourseDetailTab;
  onTabChange: (tab: CourseDetailTab) => void;
}

/**
 * CourseDetailShellTabs — Canonical 4-tab strip for /courses/:courseId.
 * Mirrors shared UnderlineTabs spec: ink active text (#0F172A),
 * muted inactive (#64748B). Charcoal (#15171F) reserved for underline bar.

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
          background: 'transparent',
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
                position: 'relative',
                flex: '0 0 auto',
                height: 44,
                padding: '12px 4px 10px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? INK : INK_MUTE,
                background: 'transparent',
                border: 'none',
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'flex-end',

              }}
            >
              <span style={{ position: 'relative', display: 'inline-block' }}>
                {tab.label}
                {isActive ? (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -4,
                      height: 1,
                      borderRadius: 2,
                      background: '#15171F',
                    }}
                  />
                ) : null}
              </span>


            </button>
          );
        })}
      </div>
    </>
  );
};

export default CourseDetailShellTabs;
