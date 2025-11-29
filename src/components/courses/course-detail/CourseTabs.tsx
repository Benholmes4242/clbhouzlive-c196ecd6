import React from 'react';

export type CourseTabId = 'about' | 'reviews' | 'media';

const COURSE_TABS: { id: CourseTabId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'media', label: 'Media' },
];

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (tab: CourseTabId) => void;
}

export function CourseTabs({ activeTab, onChange }: CourseTabsProps) {
  const activeIndex = COURSE_TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="px-4 pt-3 pb-3 bg-slate-50">
      <div className="relative mx-auto flex h-9 max-w-[360px] items-center rounded-full bg-slate-100/90 px-1 py-1 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        {/* Sliding active pill */}
        <div
          className="absolute inset-y-1 w-[calc(33.333%-0.25rem)] rounded-full bg-white shadow-[0_2px_7px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out"
          style={{ 
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem))`,
            left: '0.25rem'
          }}
        />

        {/* Tab labels */}
        {COURSE_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`
                relative z-10 flex-1 text-center text-[15px] font-medium transition-colors duration-200
                ${isActive ? 'text-slate-900' : 'text-slate-600'}
              `}
              aria-pressed={isActive}
              role="tab"
              aria-selected={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
