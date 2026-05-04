/**
 * MorningMoment — thin wrapper around MorningMomentSection.
 * The placeholder shipped under §4 of the previous fix brief is now replaced
 * with real, data-driven content (see ./morning-moment/MorningMomentSection).
 */
import React from 'react';
import MorningMomentSection from './morning-moment/MorningMomentSection';

interface Props {
  userId: string;
}

const MorningMoment: React.FC<Props> = ({ userId }) => {
  return <MorningMomentSection userId={userId} />;
};

export default MorningMoment;
