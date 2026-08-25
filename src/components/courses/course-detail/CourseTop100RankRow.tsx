/**
 * CourseTop100RankRow - the one fact the rest of the page does not state:
 * the SET of Top 100 lists this course appears in, and at what rank.
 *
 * Renders as the footer of the About panel. Personal progress deliberately
 * lives on the Top 100 tab, not here. Absent ranks render nothing.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { A, LABEL, NUM } from '@/features/courses/components/holes/analytical/tokens';

type Props = { courseId: string };

export const CourseTop100RankRow: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation('courses');
  const { data } = useTop100CourseInsights(courseId);
  const navigate = useNavigate();

  const cells = (data?.list_memberships ?? []).filter((m) => m.rank != null);
  if (cells.length === 0) return null;

  const handleChipTap = (_listSlug: string) => {
    navigate('/courses?tab=top100');
  };

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span style={{ ...LABEL, flexShrink: 0, paddingTop: 2 }}>
        {t('courseDetail.about.top100Label')}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-start',
        }}
      >
        {cells.map((m) => (
          <button
            key={m.list_slug}
            type="button"
            onClick={() => handleChipTap(m.list_slug)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'center',
              minWidth: 0,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ ...NUM, fontSize: 15, color: A.INK, lineHeight: 1 }}>#{m.rank}</div>
            <div style={{ ...LABEL, marginTop: 3 }}>
              {m.short_label || m.list_name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourseTop100RankRow;
