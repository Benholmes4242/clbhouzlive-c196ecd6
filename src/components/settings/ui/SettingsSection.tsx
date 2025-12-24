import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Whether section is collapsible on mobile */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * SettingsSection - Glass container for grouping settings rows
 * 
 * Uses Clbhouz dark glass spec:
 * - background: rgba(10,10,10,0.78)
 * - backdrop-filter: blur(22px)
 * - border: 1px solid rgba(255,255,255,0.05)
 * - radius: 18px
 */
export function SettingsSection({ 
  title, 
  children, 
  className,
  collapsible = false,
  defaultCollapsed = false 
}: SettingsSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <section className={cn('space-y-2', className)}>
      {/* Section header */}
      <button
        type="button"
        className={cn(
          'w-full text-left px-3.5',
          collapsible && 'cursor-pointer'
        )}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        disabled={!collapsible}
      >
        <h2 className="text-[13px] font-semibold tracking-[0.3px] text-white/60 uppercase">
          {title}
        </h2>
      </button>

      {/* Glass container */}
      {!isCollapsed && (
        <div
          className={cn(
            'rounded-[18px] overflow-hidden',
            'border border-white/5',
            'shadow-[0_6px_30px_rgba(0,0,0,0.35)]'
          )}
          style={{
            background: 'rgba(10,10,10,0.78)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
