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
 * SegmentedControl — Pinpoint main tab (typographic underline, keeps icon support)
 */
const SegmentedControl: React.FC<SegmentedControlProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <section className={cn('py-0 px-4 bg-background flex justify-center', className)}>
      <div
        role="tablist"
        style={{ borderBottom: '1px solid hsl(var(--border))', display: 'inline-flex', gap: 34, justifyContent: 'center' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '14px 7px 12px',
                fontSize: 19,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                letterSpacing: isActive ? '-0.025em' : '0',
                position: 'relative',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 0.18s',
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
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
    </section>
  );
};

export default SegmentedControl;
