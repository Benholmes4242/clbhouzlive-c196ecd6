import React from 'react';
import { cn } from '@/lib/utils';
import { GroupLabel } from '@/components/manage/ui';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Variant for special styling */
  variant?: 'default' | 'danger';
}

/**
 * Direction A section: quiet uppercase slate group label (no cut-line,
 * no amber kicker) above a white hairline card.
 */
export function SettingsSection({
  title,
  children,
  className,
  variant = 'default',
}: SettingsSectionProps) {
  const isDanger = variant === 'danger';

  return (
    <section className={cn('w-full', className)}>
      <GroupLabel tone={isDanger ? 'danger' : 'slate'}>{title}</GroupLabel>

      {/* Content card */}
      <div
        className="w-full rounded-[14px] overflow-hidden"
        style={isDanger
          ? { background: '#ffffff', border: '1px solid rgba(220,38,38,0.14)' }
          : { background: '#ffffff', border: '1px solid rgba(15,23,42,0.08)' }
        }
      >
        {children}
      </div>
    </section>
  );
}
