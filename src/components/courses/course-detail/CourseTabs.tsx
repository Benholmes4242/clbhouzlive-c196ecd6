import React from 'react';

export type CourseTabId = 'about' | 'reviews' | 'media';

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
  reviewCount?: number;
  mediaCount?: number;
}

const tabs: { id: CourseTabId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'media', label: 'Media' },
];

/**
 * CourseTabs — Pinpoint main tab (typographic underline)
 */
export function CourseTabs({ activeTab, onChange, reviewCount, mediaCount }: CourseTabsProps) {
  const getLabel = (tab: { id: CourseTabId; label: string }) => {
    if (tab.id === 'reviews' && reviewCount) return `${tab.label} (${reviewCount})`;
    if (tab.id === 'media' && mediaCount) return `${tab.label} (${mediaCount})`;
    return tab.label;
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(15,23,42,0.07)', display: 'flex', gap: 34, justifyContent: 'center', background: 'hsl(var(--background))' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '14px 7px 12px',
              fontSize: 19,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#0F172A' : '#94A3B8',
              letterSpacing: isActive ? '-0.025em' : '0',
              position: 'relative',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.18s',
            }}
          >
            {getLabel(tab)}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
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
  );
}