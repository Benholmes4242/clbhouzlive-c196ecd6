import React from 'react'; // v2 - slim spotlight card
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { Trophy } from 'lucide-react';

type CourseTop100SpotlightProps = {
  courseId: string;
  courseName: string;
};

export const CourseTop100Spotlight: React.FC<CourseTop100SpotlightProps> = ({
  courseId,
  courseName,
}) => {
  const { data, isLoading } = useTop100CourseInsights(courseId);

  if (isLoading) {
    return (
      <div className="rounded-[22px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] px-4 py-4">
        <div className="mb-1 h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mb-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-[14px] bg-slate-100" />
          <div className="h-7 w-28 animate-pulse rounded-[14px] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!data || !data.list_memberships || data.list_memberships.length === 0) {
    // Not a Top 100 course – no spotlight
    return null;
  }

  return (
    <div className="rounded-[22px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] px-4 py-4">
      {/* Row 1 – Title */}
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold text-slate-900">
          Top 100 Spotlight
        </span>
      </div>

      {/* Row 2 – Description */}
      <p className="text-xs text-slate-500 mb-2">
        This course appears in the following Top 100 lists:
      </p>

      {/* Row 3 – Pills */}
      <div className="flex flex-wrap gap-2">
        {data.list_memberships.map((list) => (
          <span
            key={list.list_slug}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-[14px]"
          >
            {list.list_name}
          </span>
        ))}
      </div>
    </div>
  );
};
