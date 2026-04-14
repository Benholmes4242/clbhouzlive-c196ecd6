import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  secondaryDescription?: string;
  showActionButton?: boolean;
  onActionClick?: () => void;
  actionButtonLabel?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  secondaryDescription,
  showActionButton,
  onActionClick,
  actionButtonLabel = 'Add',
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] mx-auto">
        {description}
      </p>
      {secondaryDescription && (
        <p className="text-xs text-muted-foreground/70 max-w-[260px] mx-auto mt-1.5">
          {secondaryDescription}
        </p>
      )}
      {showActionButton && onActionClick && (
        <Button
          onClick={onActionClick}
          size="sm"
          className="mt-4"
        >
          {actionButtonLabel}
        </Button>
      )}
    </div>
  );
}
