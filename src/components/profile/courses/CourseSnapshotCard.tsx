import React from 'react';
import { MapPin, Trophy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CourseSnapshotCardProps {
  totalCoursesPlayed: number;
  uniqueClubsPlayed: number;
  newCoursesThisYear: number;
  isOwnProfile: boolean;
  onAddCourse?: () => void;
}

/**
 * Hero card showing a summary of the user's course journey.
 * Uses warm, neutral styling (not Top 100 focused).
 */
export const CourseSnapshotCard: React.FC<CourseSnapshotCardProps> = ({
  totalCoursesPlayed,
  uniqueClubsPlayed,
  newCoursesThisYear,
  isOwnProfile,
  onAddCourse,
}) => {
  // Calculate next milestone
  const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500];
  const nextMilestone = milestones.find(m => m > totalCoursesPlayed) || 500;
  const coursesToNextMilestone = nextMilestone - totalCoursesPlayed;
  const progressPercent = totalCoursesPlayed > 0 
    ? Math.min((totalCoursesPlayed / nextMilestone) * 100, 100) 
    : 0;

  // Empty state
  if (totalCoursesPlayed === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-sq-lg p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Start your course journey
            </h3>
            <p className="text-sm text-slate-500">
              Play and rate your first course to unlock your Course Snapshot.
            </p>
          </div>
          {isOwnProfile && onAddCourse && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onAddCourse}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first course
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-stone-50 to-slate-50 border border-slate-100 rounded-sq-lg p-5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Your Course Snapshot
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A quick look at your time on course.
          </p>
        </div>
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left column - Main stat */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="text-3xl font-bold text-slate-900">{totalCoursesPlayed}</span>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Courses played
          </p>
          <div className="space-y-0.5">
            <p className="text-xs text-slate-500">
              Across {uniqueClubsPlayed} unique clubs
            </p>
            {newCoursesThisYear > 0 && (
              <p className="text-xs text-slate-500">
                {newCoursesThisYear} new courses this year
              </p>
            )}
          </div>
        </div>

        {/* Right column - Progress block */}
        <div className="bg-white/60 rounded-sq-sm p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-slate-600">
              Next course milestone
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-2">
            <span className="font-semibold">{coursesToNextMilestone}</span> courses to reach {nextMilestone} played
          </p>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};