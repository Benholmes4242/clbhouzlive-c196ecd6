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
 * Course detail tabs with segmented control styling
 * Light blue track with white active button (matches profile page)
 */
export function CourseTabs({ activeTab, onChange, reviewCount, mediaCount }: CourseTabsProps) {
  const getLabel = (tab: { id: CourseTabId; label: string }) => {
    if (tab.id === 'reviews' && reviewCount !== undefined && reviewCount > 0) {
      return `${tab.label} (${reviewCount})`;
    }
    if (tab.id === 'media' && mediaCount !== undefined && mediaCount > 0) {
      return `${tab.label} (${mediaCount})`;
    }
    return tab.label;
  };

  return (
    <section className="px-4 py-3 bg-slate-50">
      <div 
        className="flex items-stretch rounded-xl overflow-hidden"
        style={{ background: '#e2e8f0' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap min-h-[44px]",
                isActive 
                  ? "bg-white text-slate-800 shadow-sm m-1 rounded-lg" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {getLabel(tab)}
            </button>
          );
        })}
      </div>
    </section>
  );
}