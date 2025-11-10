import React from 'react';
import { TagChip } from './TagChip';
import { cn } from '@/lib/utils';

export interface ThreadTagBarProps {
  tags: string[];
  className?: string;
}

export function ThreadTagBar({ tags, className }: ThreadTagBarProps) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, 2);
  const remainingCount = tags.length - 2;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visibleTags.map((tag, index) => (
        <TagChip key={index} label={tag} variant="outline" />
      ))}
      {remainingCount > 0 && (
        <span
          className="text-xs text-muted-foreground px-2 py-0.5"
          title={tags.slice(2).join(', ')}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
