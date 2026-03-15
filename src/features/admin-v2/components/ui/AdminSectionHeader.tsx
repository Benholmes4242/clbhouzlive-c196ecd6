import React from 'react';
import { cn } from '@/lib/utils';

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminSectionHeader({
  title,
  description,
  action,
  className,
}: AdminSectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-0.5">
        <h2 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</h2>
        {description && (
          <p style={{ fontSize: 13, color: '#64748B' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
