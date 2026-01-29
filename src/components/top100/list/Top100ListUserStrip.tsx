import React from 'react';

interface Top100ListUserStripProps {
  playedCount: number;
  totalCourses: number;
  listName: string; // e.g., "Worldwide", "USA", "Britain & Ireland", "Continental Europe"
  isOwnProfile?: boolean;
  firstName?: string;
}

export const Top100ListUserStrip: React.FC<Top100ListUserStripProps> = ({
  playedCount,
  totalCourses,
  listName,
  isOwnProfile = true,
  firstName,
}) => {
  const subject = isOwnProfile ? "You've" : `${firstName || 'They'} ${firstName ? 'has' : 'have'}`;
  
  return (
    <div className="mx-4 mt-4 rounded-sq-md bg-white shadow-sm px-4 py-3 border border-slate-100 text-center">
      <div className="text-[15px] font-semibold text-slate-900">
        {subject} played {playedCount} of {totalCourses} courses on the {listName} Top 100 list
      </div>
    </div>
  );
};
