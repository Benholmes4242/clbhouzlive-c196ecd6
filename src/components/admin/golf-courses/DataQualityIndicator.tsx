import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GolfCourse } from './types';

interface DataQualityIndicatorProps {
  course: GolfCourse;
  showLabels?: boolean;
}

export function DataQualityIndicator({ course, showLabels = false }: DataQualityIndicatorProps) {
  const issues: { color: string; label: string; key: string }[] = [];

  // Check for missing coordinates
  if (!course.latitude || !course.longitude) {
    issues.push({ color: 'bg-red-500', label: 'Missing coordinates', key: 'coords' });
  }

  // Check for missing images
  if (!course.thumbnail_image) {
    issues.push({ color: 'bg-yellow-500', label: 'No images', key: 'images' });
  }

  // Check for missing description
  if (!course.description) {
    issues.push({ color: 'bg-orange-500', label: 'No description', key: 'desc' });
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {issues.map((issue) => (
        <Tooltip key={issue.key}>
          <TooltipTrigger asChild>
            <div 
              className={`w-2 h-2 rounded-full ${issue.color} cursor-help`}
              aria-label={issue.label}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {issue.label}
          </TooltipContent>
        </Tooltip>
      ))}
      {showLabels && (
        <span className="text-xs text-muted-foreground ml-1">
          {issues.length} issue{issues.length > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
