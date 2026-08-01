import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './analytical/tokens';

/**
 * Holes empty state (BRIEF_COURSE_DETAIL_EMPTY_STATES) - the shared
 * EmptyState panel. No icon tile, no amber dot, no ghost rows.
 */
export const HolesEmptyState: React.FC<{ courseName: string | null }> = ({ courseName }) => {
  const { t } = useTranslation(['courses']);
  const resolvedName = courseName ?? t('courses:holes.empty.thisCourse');
  return (
    <div style={{ padding: '20px 16px' }}>
      <EmptyState
        kicker={t('courses:holes.empty.eyebrow')}
        title={t('courses:holes.empty.title')}
        body={t('courses:holes.empty.body', { courseName: resolvedName })}
      />
    </div>
  );
};

export default HolesEmptyState;
