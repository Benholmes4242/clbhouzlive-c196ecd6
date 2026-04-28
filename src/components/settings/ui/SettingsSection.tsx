import React from 'react';
import { cn } from '@/lib/utils';

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
  variant = 'default'
}: SettingsSectionProps) {
  const isDanger = variant === 'danger';

  return (
    <section className={cn('w-full', className)}>
      {/* Dispatch rule marker eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 3, height: 10, background: isDanger ? '#DC2626' : '#F7931E', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: isDanger ? '#DC2626' : '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          {title}
        </span>
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