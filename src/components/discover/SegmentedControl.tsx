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
 * SegmentedControl — Main tab component (Tier 1).
 * Active: #1e293b rounded rectangle pill, no track.
 */
const SegmentedControl: React.FC<SegmentedControlProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <section className={cn('py-3 -mx-4 px-4 bg-background', className)}>
      <div className="flex gap-1">
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
                  ? 'text-white font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              style={isActive ? { backgroundColor: 'hsl(var(--tab-main-active))' } : undefined}
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
