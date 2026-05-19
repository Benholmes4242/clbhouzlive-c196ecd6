import React from 'react';
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
  currentHandicap: _currentHandicap,
  readOnly: _readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-records"
      aria-labelledby="handicap-tab-records"
      style={{ paddingTop: 16 }}
    >
      {/* 1. Recent Rounds */}
      <RecentRoundsCard connectionId={connectionId} />
    </div>
  );
};

export default RecordsView;
