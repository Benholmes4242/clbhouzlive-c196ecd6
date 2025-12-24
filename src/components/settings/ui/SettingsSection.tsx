import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

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
 * SettingsSection - Light card container for grouping settings rows
 * 
 * Uses global light system:
 * - background: #FAFAFB (--surface-card)
 * - border: 1px solid rgba(31,36,40,0.06)
 * - radius: 16px
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
          'w-full text-left px-3.5 flex items-center justify-between',
          collapsible && 'cursor-pointer'
        )}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        disabled={!collapsible}
      >
        <h2 className="text-[13px] font-semibold tracking-[0.3px] text-[#5E666D] uppercase">
          {title}
        </h2>
        {collapsible && (
          <ChevronDown 
            className={cn(
              'w-4 h-4 text-[#97A1AA] transition-transform duration-200',
              isCollapsed && '-rotate-90'
            )} 
          />
        )}
      </button>

      {/* Card container */}
      {!isCollapsed && (
        <div
          className={cn(
            'rounded-[16px] overflow-hidden',
            'border border-[rgba(31,36,40,0.06)]',
            'bg-[#FAFAFB]',
            'shadow-[0_2px_8px_rgba(31,36,40,0.04)]'
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
