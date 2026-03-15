import React from 'react';
import { Camera, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MediaCounts } from './hooks/useCourseMedia';
import type { CourseMediaFilter } from './hooks/useCourseMedia';

interface CourseMediaHeaderProps {
  mediaCounts: MediaCounts;
  activeFilter: CourseMediaFilter;
  onFilterChange: (filter: CourseMediaFilter) => void;
  courseId: string;
}

const FILTERS: { key: CourseMediaFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos' },
];

export const CourseMediaHeader: React.FC<CourseMediaHeaderProps> = ({
  mediaCounts,
  activeFilter,
  onFilterChange,
  courseId,
}) => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-3 pb-2 flex flex-col gap-3">
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Camera className="w-3.5 h-3.5" />
          <span className="animate-in fade-in duration-300">
            <span className="font-semibold text-foreground">{mediaCounts.photos}</span> photos
            {' · '}
            <span className="font-semibold text-foreground">{mediaCounts.videos}</span> videos
          </span>
        </div>
        <button
          onClick={() => navigate(`/courses/${courseId}/rate`)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#f59e0b] text-[#d97706] hover:bg-amber-50 active:scale-[0.97] transition-all min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add media
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center justify-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              'min-h-[44px] px-4 rounded-full text-sm font-semibold transition-colors',
              activeFilter === key
                ? 'bg-[#f59e0b] text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
