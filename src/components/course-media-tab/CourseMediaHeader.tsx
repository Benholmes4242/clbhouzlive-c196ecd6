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
    <div style={{ padding: '12px 16px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Count row + Add media */}
      {(mediaCounts.photos > 0 || mediaCounts.videos > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
            <Camera className="w-3.5 h-3.5" />
            <span>
              <b style={{ color: '#0F172A' }}>{mediaCounts.photos}</b> photos
              {' · '}
              <b style={{ color: '#0F172A' }}>{mediaCounts.videos}</b> videos
            </span>
          </div>
          <button
            onClick={() => navigate(`/courses/${courseId}/rate`)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(15,23,42,0.05)', border: 'none', fontSize: 12, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add media
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              style={{ padding: '6px 18px', borderRadius: 8, fontSize: 12, fontWeight: isActive ? 800 : 600, background: isActive ? '#0F172A' : 'transparent', color: isActive ? '#fff' : '#94A3B8', border: isActive ? 'none' : '1px solid rgba(15,23,42,0.1)', cursor: 'pointer', minHeight: 34 }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};