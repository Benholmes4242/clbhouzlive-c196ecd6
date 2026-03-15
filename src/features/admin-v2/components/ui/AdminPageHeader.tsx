import React from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  action,
  meta,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>
            {title}
          </h1>
          {meta}
        </div>
        {description && (
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }} className="max-w-xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
