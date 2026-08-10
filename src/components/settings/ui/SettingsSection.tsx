import React from 'react';
import { cn } from '@/lib/utils';
import { A, BIZ_KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SETTINGS_PANEL_PADDING } from './rowParts';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'danger';
}

/**
 * A quiet KICKER above a hairline card. No tiles inside, no rules between rows:
 * the card's own edge is the only line on the page.
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
      <div style={{ ...BIZ_KICKER, color: isDanger ? A.RED : A.INK, marginBottom: 8 }}>{title}</div>

      <div
        className="w-full rounded-[14px]"
        style={{
          background: A.PANEL,
          border: `1px solid ${isDanger ? 'rgba(200,55,43,0.16)' : A.BORDER}`,
          padding: SETTINGS_PANEL_PADDING,
        }}
      >
        {children}
      </div>
    </section>
  );
}
