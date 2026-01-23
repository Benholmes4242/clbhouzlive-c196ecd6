import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';

interface InactivityNudgeProps {
  daysSinceLastCourse: number;
  onLogCourse: () => void;
}

export const InactivityNudge: React.FC<InactivityNudgeProps> = ({
  daysSinceLastCourse,
  onLogCourse,
}) => {
  if (daysSinceLastCourse < 7) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-sq-md p-4 my-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-700">
            It's been {daysSinceLastCourse} days
          </p>
          <p className="text-sm text-slate-500">
            Log a course to stay in the race
          </p>
        </div>
        <button
          onClick={onLogCourse}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Log course
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
