import React from 'react'; // v3 - tappable chips with states
import { useTop100CourseInsights } from '@/hooks/useTop100CourseInsights';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CourseTop100SpotlightProps = {
  courseId: string;
  courseName: string;
};

export const CourseTop100Spotlight: React.FC<CourseTop100SpotlightProps> = ({
  courseId,
  courseName,
}) => {
  const { data, isLoading } = useTop100CourseInsights(courseId);
  const navigate = useNavigate();

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

  // D1: Handle chip tap - navigate to appropriate Top 100 list
  const handleChipTap = (listSlug: string) => {
    navigate(`/top100?list=${listSlug}`);
  };

  return (
    <div className="rounded-[22px] bg-gradient-to-br from-[#D2B461]/10 to-white shadow-[0_1px_4px_rgba(180,130,40,0.12)] border border-[#D2B461]/20 px-4 py-4">
      {/* Row 1 – Title */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(210, 180, 97, 0.15)' }}>
          <Trophy className="h-3.5 w-3.5" style={{ color: '#D2B461' }} />
        </div>
        <span className="text-sm font-semibold text-slate-900">
          Top 100 Spotlight
        </span>
      </div>

      {/* Row 2 – Description */}
      <p className="text-xs text-slate-500 mb-2">
        This course appears in the following Top 100 lists:
      </p>

      {/* Row 3 – Tappable Pills with states */}
      <div className="flex flex-wrap gap-2">
        {data.list_memberships.map((list) => (
          <button
            key={list.list_slug}
            type="button"
            onClick={() => handleChipTap(list.list_slug)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-[14px] transition-all hover:bg-slate-200 active:scale-[0.97] active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
          >
            {list.list_name}
          </button>
        ))}
      </div>
    </div>
  );
};
