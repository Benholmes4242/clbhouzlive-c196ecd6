import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Variant for special styling */
  variant?: 'default' | 'danger';
}

/**
 * SettingsSection - Card-based section with header and card container
 * 
 * Premium visual design:
 * - Section header: uppercase, subtle gray, outside card
 * - Card: white background, subtle shadow, rounded corners
 */
export function SettingsSection({ 
  title, 
  children, 
  className,
  variant = 'default'
}: SettingsSectionProps) {
  const isDanger = variant === 'danger';

  return (
    <section className={cn('w-full px-4', className)}>
      {/* Section header - outside card */}
      <h2 
        className={cn(
          'text-[11px] font-semibold tracking-[0.5px] mb-2.5 ml-1',
          isDanger ? 'text-red-400' : 'text-muted-foreground'
        )}
      >
        {title}
      </h2>

      {/* Card container */}
      <div
        className={cn(
          'w-full rounded-2xl overflow-hidden',
          'shadow-sm',
          isDanger 
            ? 'bg-red-50/50 border border-red-100' 
            : 'bg-card border border-border'
        )}
      >
        {children}
      </div>
    </section>
  );
}
