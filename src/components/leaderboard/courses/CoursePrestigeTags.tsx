import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  tags: string[];
}

const tagStyles: Record<string, string> = {
  'Hall of Fame': 'bg-amber-100 text-amber-700',
  'Top 10 Worldwide': 'bg-blue-100 text-blue-700',
  'Fan Favourite': 'bg-pink-100 text-pink-700',
  'Fastest Rising': 'bg-emerald-100 text-emerald-700',
  'Season Winner': 'bg-purple-100 text-purple-700',
};

export const CoursePrestigeTags: React.FC<Props> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  // Only show max 2 tags
  const displayTags = tags.slice(0, 2);

  return (
    <div className="flex items-center gap-1 mt-1">
      {displayTags.map((tag) => (
        <span
          key={tag}
          className={cn(
            'px-1.5 py-0.5 rounded text-[9px] font-medium',
            tagStyles[tag] || 'bg-muted text-muted-foreground'
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};
