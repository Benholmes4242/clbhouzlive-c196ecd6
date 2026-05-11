import React from 'react';
import WhereYouStandSection from '../sections/WhereYouStandSection';
import RecentRoundsCard from '../sections/trends/RecentRoundsCard';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections (Where You Stand). */
  readOnly?: boolean;
}

export const RecordsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap: _currentHandicap,
  readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-records"
      aria-labelledby="handicap-tab-records"
    >
      {!readOnly && <WhereYouStandSection userId={userId} />}
      <RecentRoundsCard connectionId={connectionId} />
    </div>
  );
};

export default RecordsView;
