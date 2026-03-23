import React from 'react';
import { cn } from '@/lib/utils';

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
    <section className="px-4 pt-1 pb-0 flex justify-center">
      <div style={{ borderBottom: '1px solid hsl(var(--border))', display: 'inline-flex', gap: 20, justifyContent: 'center' }}>
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
                padding: '11px 2px 9px',
                fontSize: 16,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
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
}
