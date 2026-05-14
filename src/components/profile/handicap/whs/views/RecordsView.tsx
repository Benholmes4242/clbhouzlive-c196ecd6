import React from 'react';
import CourseFormCard from '../sections/trends/CourseFormCard';
import RecentRoundsCard from '../sections/trends/RecentRoundsCard';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections. */
  readOnly?: boolean;
}

export const RecordsView: React.FC<Props> = ({
  connectionId,
  userId: _userId,
  currentHandicap,
  readOnly: _readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-records"
      aria-labelledby="handicap-tab-records"
    >
      <CourseFormCard connectionId={connectionId} currentHandicap={currentHandicap ?? undefined} />
      <RecentRoundsCard connectionId={connectionId} />
    </div>
  );
};

export default RecordsView;
