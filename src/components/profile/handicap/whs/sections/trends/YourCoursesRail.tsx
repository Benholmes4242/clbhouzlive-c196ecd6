import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MAX_ITEMS = 6;

interface Props {
  readOnly?: boolean;
}

/**
 * Phase C cross-link — a horizontal rail of compact cards linking to each
 * course's Analytics tab. Reuses `useUserAnalyticsCourses` (Phase B) so this
 * surface can never disagree with the profile sheet entry point.
 * Renders only when the list is non-empty. Owner-only.
 */
export const YourCoursesRail: React.FC<Props> = ({ readOnly = false }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const enabled = !readOnly;
  const { data, isLoading, isError } = useUserAnalyticsCourses({ enabled });

  if (readOnly) return null;

  if (isLoading) {
    return (
      <section style={{ marginTop: 24 }}>
        <DarkSectionHeader
          eyebrow={t('holes.yourCourses.eyebrow')}
          title={t('holes.yourCourses.title')}
        />
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '4px 18px 0',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-[76px]"
              style={{ flex: '0 0 168px', borderRadius: 12 }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data || data.length === 0) return null;

  const items = data.slice(0, MAX_ITEMS);

  return (
    <section style={{ marginTop: 24 }}>
      <DarkSectionHeader
        eyebrow={t('holes.yourCourses.eyebrow')}
        title={t('holes.yourCourses.title')}
      />
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '4px 18px 4px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((c) => (
          <button
            key={c.course_id}
            type="button"
            onClick={() => navigate(`/courses/${c.course_id}?tab=holes`)}
            style={{
              flex: '0 0 168px',
              minHeight: 76,
              padding: '12px 14px',
              background: 'var(--hcp-surface-2, rgba(255,255,255,0.04))',
              border: '1px solid var(--hcp-line)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'left',
              fontFamily: FONT,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--hcp-t-100)',
                letterSpacing: '-0.005em',
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {c.course_name}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-60)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t('holes.yourCourses.nRounds', {
                count: c.rounds_count,
                rounds: c.rounds_count,
              })}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default YourCoursesRail;
