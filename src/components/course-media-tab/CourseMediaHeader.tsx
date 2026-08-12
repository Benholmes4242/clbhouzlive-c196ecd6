import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MediaCounts } from './hooks/useCourseMedia';
import type { CourseMediaFilter } from './hooks/useCourseMedia';
import { INK, HAIRLINE_INK_10 } from '@/features/courses/_shared/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';



interface CourseMediaHeaderProps {
  mediaCounts: MediaCounts;
  activeFilter: CourseMediaFilter;
  onFilterChange: (filter: CourseMediaFilter) => void;
  courseId: string;
}

const FILTER_KEYS: { key: CourseMediaFilter; i18nKey: string }[] = [
  { key: 'all', i18nKey: 'courses:media.filterAll' },
  { key: 'photos', i18nKey: 'courses:media.filterPhotos' },
  { key: 'videos', i18nKey: 'courses:media.filterVideos' },
];

export const CourseMediaHeader: React.FC<CourseMediaHeaderProps> = ({
  mediaCounts,
  activeFilter,
  onFilterChange,
  courseId,
}) => {
  const { t } = useTranslation(['courses']);
  const navigate = useNavigate();

  const hasMedia = mediaCounts.total > 0;
  const hasBothTypes = mediaCounts.photos > 0 && mediaCounts.videos > 0;

  useEffect(() => {
    if (!hasBothTypes && activeFilter !== 'all') {
      onFilterChange('all');
    }
  }, [hasBothTypes, activeFilter, onFilterChange]);

  const countFor = (key: CourseMediaFilter) =>
    key === 'all' ? mediaCounts.total : key === 'photos' ? mediaCounts.photos : mediaCounts.videos;

  if (!hasMedia) return null;

  const onlyPhotos = mediaCounts.photos > 0;
  const rawCount = onlyPhotos ? mediaCounts.photos : mediaCounts.videos;
  const formatted = rawCount.toLocaleString();

  if (!hasBothTypes) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 12px' }}>
        <span
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: A.DIM,
            fontVariantNumeric: 'tabular-nums lining',
          }}
        >
          {t(onlyPhotos ? 'courses:media.countPhotos' : 'courses:media.countVideos', {
            count: rawCount,
            formatted,
          })}
        </span>

        <button
          onClick={() => navigate(`/courses/${courseId}/rate`)}
          aria-label={t('courses:media.addMediaA11y')}
          style={{
            marginLeft: 'auto', width: 34, height: 34, borderRadius: 17,
            background: A.INK, color: '#FFFFFF', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={t('courses:media.filterA11y')}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 12px' }}
    >
      {FILTER_KEYS.map(({ key, i18nKey }) => {
        const isActive = activeFilter === key;
        const count = countFor(key);

        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              height: 34, padding: '0 13px', borderRadius: 17,
              background: isActive ? INK : '#FFFFFF',
              border: isActive ? `1px solid ${INK}` : `1px solid ${HAIRLINE_INK_10}`,
              fontSize: 12.5, fontWeight: isActive ? 700 : 600,
              color: isActive ? '#FFFFFF' : INK,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {t(i18nKey)}
            {(
              <span style={{
                fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums lining',
                color: isActive ? 'rgba(255,255,255,0.6)' : A.DIM,
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}

      {(
        <button
          onClick={() => navigate(`/courses/${courseId}/rate`)}
          aria-label={t('courses:media.addMediaA11y')}
          style={{
            marginLeft: 'auto', width: 34, height: 34, borderRadius: 17,
            background: A.INK, color: '#FFFFFF', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}

        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};