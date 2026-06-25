import React from 'react';
import { Camera, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MediaCounts } from './hooks/useCourseMedia';
import type { CourseMediaFilter } from './hooks/useCourseMedia';
import { INK, INK_FAINT, INK_MUTE, INK_TINT_05 } from '@/features/courses/_shared/tokens';


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

      {/* Filter tabs — underline style (matches player profile) */}
      <div
        role="tablist"
        aria-label="Media filter"
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-start',
          paddingLeft: 12,
          fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(key)}
              style={{
                flex: '0 0 auto',
                height: 44,
                padding: '0 8px',
                borderRadius: 0,
                border: 'none',
                background: 'transparent',
                color: isActive ? INK : INK_FAINT,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  paddingBottom: 4,
                  borderBottom: isActive ? `1.5px solid ${INK}` : '1.5px solid transparent',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};