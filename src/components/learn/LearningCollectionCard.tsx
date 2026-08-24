import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export interface LearningCollection {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
  thumbnailUrl?: string;
  skillLevel?: string;
}

interface LearningCollectionCardProps {
  collection: LearningCollection;
  onClick?: (id: string) => void;
  className?: string;
}

/**
 * LearningCollectionCard - Outcome-based skill modules
 * These build trust, not dopamine
 * Clear promise with lesson count
 */
export const LearningCollectionCard: React.FC<LearningCollectionCardProps> = ({
  collection,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={() => onClick?.(collection.id)}
      className={cn(
        "w-full text-left p-4 rounded-xl border border-border/[0.06] bg-card/80",
        "hover:bg-card hover:border-border/10 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "group",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground leading-tight mb-1">
            {collection.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {collection.description}
          </p>
          <p className="text-xs text-muted-foreground/80">
            {collection.lessonCount} {collection.lessonCount === 1 ? 'lesson' : 'lessons'}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>
    </button>
  );
};

export default LearningCollectionCard;
