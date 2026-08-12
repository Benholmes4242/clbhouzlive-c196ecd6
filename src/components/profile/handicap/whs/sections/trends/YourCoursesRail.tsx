import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { DarkSectionHeader, DARK_ROW_TITLE } from '../_shared/darkAtoms';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
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
          alignItems: 'stretch',
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
              height: '100%',
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
            <div style={{ ...DARK_ROW_TITLE, overflowWrap: 'anywhere' }}>
              {c.course_name}
            </div>
            {/* labelled figure, not a string - marginTop auto lands the count
                on the same line across every card when a name wraps */}
            <div style={{ marginTop: 'auto', paddingTop: 10 }}>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: 'var(--hcp-t-100)',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  lineHeight: 1,
                }}
              >
                {c.rounds_count}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--hcp-t-40)',
                }}
              >
                {t('holes.yourCourses.roundsLabel')}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default YourCoursesRail;
