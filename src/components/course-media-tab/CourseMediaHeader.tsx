import React from 'react';
import { Camera, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MediaCounts } from './hooks/useCourseMedia';
import type { CourseMediaFilter } from './hooks/useCourseMedia';
import { INK, INK_FAINT, INK_MUTE, INK_TINT_05 } from '@/features/courses/_shared/tokens';
import { SectionLabel } from '@/components/courses/course-detail/SectionLabel';


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
    <div style={{ padding: '14px 0 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel text="Gallery" icon={Camera} />
      {/* Count row + Add media */}
      {(mediaCounts.photos > 0 || mediaCounts.videos > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: INK_MUTE }}>
            <Camera className="w-3.5 h-3.5" />
            <span>
              <b style={{ color: INK }}>{mediaCounts.photos}</b> photos
              {' · '}
              <b style={{ color: INK }}>{mediaCounts.videos}</b> videos
            </span>
          </div>
          <button
            onClick={() => navigate(`/courses/${courseId}/rate`)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: INK_TINT_05, border: 'none', fontSize: 12, fontWeight: 700, color: INK, cursor: 'pointer' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add media
          </button>
        </div>
      )}

      {/* Filter chips — text-only, bold = active */}
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              style={{
                padding: '6px 4px',
                background: 'transparent',
                border: 'none',
                fontSize: 13,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? INK : INK_FAINT,
                cursor: 'pointer',
                minHeight: 34,
                letterSpacing: isActive ? '-0.01em' : 0,
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