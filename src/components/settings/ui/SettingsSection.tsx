import React from 'react';
import { cn } from '@/lib/utils';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Variant for special styling */
  variant?: 'default' | 'danger';
}

export function SettingsSection({
  title,
  children,
  className,
  variant = 'default',
}: SettingsSectionProps) {
  const isDanger = variant === 'danger';

  return (
    <section className={cn('w-full', className)}>
      {/* Canonical section eyebrow */}
      <div style={{ marginBottom: 8 }}>
        <SectionEyebrow label={title} color={isDanger ? 'danger' : 'slate'} />
      </div>

      {/* Content card */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={isDanger
          ? { background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.10)' }
          : { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }
        }
      >
        {children}
      </div>
    </section>
  );
}
