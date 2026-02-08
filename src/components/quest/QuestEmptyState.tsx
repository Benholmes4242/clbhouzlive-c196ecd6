/**
 * QuestEmptyState - Shared empty state component for Quest pages
 * Friendly prompts with CTAs
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface QuestEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const QuestEmptyState: React.FC<QuestEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 border border-border">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 min-h-[44px] bg-[#F7931E] text-white font-medium rounded-full hover:bg-[#E8820D] transition-colors shadow-sm active:scale-[0.98]"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default QuestEmptyState;