import React, { useRef, useEffect, useState } from 'react';
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
  variant?: 'light' | 'dark' | 'slate';
  align?: 'start' | 'center';
}

/**
 * SegmentedControl — Canonical destination tab strip.
 * Soft-squircle pills (8px radius) with cream-fill active state, horizontally
 * scrollable. Used for Discover (3 tabs) and Courses (3 tabs). Tour Hub uses
 * the same spec via TourHubShellTabs.
 */
const SegmentedControl: React.FC<SegmentedControlProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = 'light',
  align = 'start',
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const isDark = variant === 'dark';

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tabs]);

  const handleTap = (tabId: string, btn: HTMLButtonElement | null) => {
    onTabChange(tabId);
    if (btn) {
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  };

  return (
    <section
      className={cn('relative', !isDark && 'bg-background', className)}
      style={{
        background: isDark ? '#0A0E14' : undefined,
        borderBottom: isDark
          ? '0.5px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(15,23,42,0.08)',
      }}
    >
      <div
        ref={scrollerRef}
        className="segmented-scroller"
        role="tablist"
        style={{
          display: 'flex',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: 8,
          padding: variant === 'slate' ? '2px 16px' : '8px 16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          fontFamily: isDark
            ? 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
            : undefined,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isSlate = variant === 'slate';
          const activeBg = isDark ? 'rgba(255,255,255,0.10)' : isSlate ? 'transparent' : '#FEF3E7';
          const activeBorder = isDark ? '1px solid rgba(255,255,255,0.55)' : isSlate ? '1px solid transparent' : '1px solid #F7931E';
          const activeColor = isDark ? '#FFFFFF' : isSlate ? '#0F172A' : '#c97a10';
          const inactiveColor = isDark ? '#FFFFFF' : isSlate ? '#94A3B8' : 'hsl(var(--muted-foreground))';
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={(e) => handleTap(tab.id, e.currentTarget)}
              style={{
                flexShrink: 0,
                height: isSlate ? 40 : 32,
                padding: isSlate ? '0 14px' : '0 12px',
                fontSize: isSlate ? 17 : 14,
                fontWeight: isActive ? 700 : 500,
                borderRadius: 8,
                background: isActive ? activeBg : 'transparent',
                border: isActive ? activeBorder : '1px solid transparent',
                color: isActive ? activeColor : inactiveColor,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {overflowing && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 28,
            pointerEvents: 'none',
            background: isDark
              ? 'linear-gradient(to right, rgba(10,14,20,0), #0A0E14)'
              : 'linear-gradient(to right, rgba(248,250,252,0), #F8FAFC)',
          }}
        />
      )}
    </section>
  );
};

export default SegmentedControl;
