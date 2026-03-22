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
 * SettingsSection - Cardless section with header and flat content
 * 
 * Premium visual design:
 * - Section header: uppercase, subtle gray, canonical tracking
 * - No card wrapper — rows sit directly on page background
 * - Danger Zone gets a subtle tinted background
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
      {/* Section header */}
      <h2 
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 ml-1',
          isDanger ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {title}
      </h2>

      {/* Content */}
      <div
        className={cn(
          'w-full rounded-2xl overflow-hidden',
          isDanger
            ? 'bg-destructive/5 border border-destructive/10'
            : 'bg-card border border-border/60 shadow-sm'
        )}
      >
        {children}
      </div>
    </section>
  );
}
