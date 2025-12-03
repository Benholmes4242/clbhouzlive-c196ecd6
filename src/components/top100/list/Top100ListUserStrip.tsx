import React from 'react';

interface Top100ListUserStripProps {
  playedCount: number;
  totalCourses: number;
  listName: string;
}

export const Top100ListUserStrip: React.FC<Top100ListUserStripProps> = ({
  playedCount,
  totalCourses,
  listName,
}) => {
  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white shadow-sm px-4 py-4 border border-slate-100">
      <div className="text-[15px] font-semibold text-slate-900">
        You've played {playedCount} of {totalCourses} courses on this list
      </div>
      <div className="mt-0.5 text-[13px] font-medium text-slate-500">
        {listName}
      </div>
    </div>
  );
};
