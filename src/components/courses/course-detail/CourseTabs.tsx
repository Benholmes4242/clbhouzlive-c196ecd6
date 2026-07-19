import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type CourseTabId = 'about' | 'reviews' | 'media' | 'holes' | 'legends';

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
  reviewCount?: number;
  mediaCount?: number;
}

const TABS: { id: CourseTabId; labelKey: string }[] = [
  { id: 'about',   labelKey: 'courseDetail.tabs.about' },
  { id: 'reviews', labelKey: 'courseDetail.tabs.reviews' },
  { id: 'media',   labelKey: 'courseDetail.tabs.media' },
  { id: 'holes',   labelKey: 'courseDetail.tabs.holes' },
  { id: 'legends', labelKey: 'courseDetail.tabs.legends' },
];

/**
 * CourseTabs — Modal tab bar for the course detail sheet.
 * Mirrors CourseDetailShellTabs' overflow handling: an internal scroller with
 * a ResizeObserver flips between space-evenly (fits) and flex-start (scrolls).
 */
export function CourseTabs({ activeTab, onChange, reviewCount, mediaCount }: CourseTabsProps) {
  const { t } = useTranslation('courses');
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

  const getLabel = (tab: { id: CourseTabId; labelKey: string }) => {
    const base = t(tab.labelKey);
    if (tab.id === 'reviews' && reviewCount) return `${base} (${reviewCount})`;
    if (tab.id === 'media' && mediaCount) return `${base} (${mediaCount})`;
    return base;
  };

  return (
    <>
      <style>{`[data-course-modal-tabs]::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={scrollerRef}
        data-course-modal-tabs
        role="tablist"
        aria-label={t('courseDetail.a11y.sections')}
        style={{
          borderBottom: '1px solid rgba(15,23,42,0.07)',
          display: 'flex',
          justifyContent: overflowing ? 'flex-start' : 'space-evenly',
          gap: overflowing ? 16 : 0,
          padding: overflowing ? '0 16px' : 0,
          background: 'hsl(var(--background))',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '14px 7px 12px',
                flex: '0 0 auto',
                fontSize: 17,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0F172A' : '#94A3B8',
                letterSpacing: isActive ? '-0.025em' : '0',
                position: 'relative',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                transition: 'color 0.18s',
              }}
            >
              {getLabel(tab)}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 0,
                  right: 0,
                  height: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
