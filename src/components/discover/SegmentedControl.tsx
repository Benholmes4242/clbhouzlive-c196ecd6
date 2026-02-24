import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * SegmentedControl — Shared pill-toggle tab component.
 * Canonical styling sourced from Tours Overview (TourHubTabs).
 *
 * Container:  bg-muted  rounded-xl  p-1
 * Active tab: bg-card  text-foreground  shadow-sm  rounded-lg  border border-border  m-1
 * Inactive:   text-muted-foreground  transparent
 *
 * All colors use design tokens — no hardcoded hex values.
 */
const SegmentedControl: React.FC<SegmentedControlProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <section className={cn('py-3 -mx-4 px-4 bg-background', className)}>
      <div className="flex p-1 rounded-xl overflow-hidden bg-muted">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.97] flex items-center justify-center',
                isActive
                  ? 'm-1 bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
              )}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SegmentedControl;
