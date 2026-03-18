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
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold active:scale-[0.97] transition-all min-h-[36px]"
          style={{ borderRadius: 8, background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: 'none' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add media
        </button>
      </div>

      {/* Filter chips — orange gradient */}
      <div className="flex items-center justify-center gap-2">
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className="min-h-[34px] px-4 text-sm font-semibold transition-colors"
              style={{
                borderRadius: 8,
                background: isActive ? 'linear-gradient(90deg, #F59E0B, #F7931E)' : 'transparent',
                color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
                boxShadow: isActive ? '0 2px 8px rgba(247,147,30,0.20)' : 'none',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
