import React from 'react';
import { Trophy, Globe, Flag, MapPin } from 'lucide-react';

interface CourseMilestonesStripProps {
  totalCoursesPlayed: number;
  countriesPlayed: number;
  newCoursesThisYear: number;
  isOwnProfile: boolean;
}

interface Milestone {
  id: string;
  title: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
}

/**
 * Horizontal strip of course milestone chips.
 * Shows exploration-based achievements.
 */
export const CourseMilestonesStrip: React.FC<CourseMilestonesStripProps> = ({
  totalCoursesPlayed,
  countriesPlayed,
  newCoursesThisYear,
  isOwnProfile,
}) => {
  // Define milestones based on user data
  const milestones: Milestone[] = [
    {
      id: '10-courses',
      title: '10 courses played',
      icon: <MapPin className="w-3 h-3" />,
      isUnlocked: totalCoursesPlayed >= 10,
    },
    {
      id: 'first-overseas',
      title: 'First overseas round',
      icon: <Globe className="w-3 h-3" />,
      isUnlocked: countriesPlayed > 1,
    },
    {
      id: '3-new-season',
      title: '3 new courses this season',
      icon: <Flag className="w-3 h-3" />,
      isUnlocked: newCoursesThisYear >= 3,
    },
    {
      id: '25-courses',
      title: '25 courses played',
      icon: <Trophy className="w-3 h-3" />,
      isUnlocked: totalCoursesPlayed >= 25,
    },
    {
      id: '5-countries',
      title: '5 countries played',
      icon: <Globe className="w-3 h-3" />,
      isUnlocked: countriesPlayed >= 5,
    },
  ];

  const unlockedMilestones = milestones.filter(m => m.isUnlocked);
  const inProgressMilestones = milestones.filter(m => !m.isUnlocked).slice(0, 2);

  // If no milestones, show a placeholder message
  if (unlockedMilestones.length === 0 && inProgressMilestones.length === 0) {
    return (
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Course Milestones
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Highlights from your course journey.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          Keep playing and rating courses to unlock course milestones.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">
          Course Milestones
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Highlights from your course journey.
        </p>
      </div>

      {/* Horizontal scroll of chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {/* Unlocked milestones */}
        {unlockedMilestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/60 rounded-sq-sm"
          >
            <span className="text-amber-600">{milestone.icon}</span>
            <span className="text-xs font-medium text-amber-800 whitespace-nowrap">
              {milestone.title}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-amber-600 font-semibold ml-1">
              ✓
            </span>
          </div>
        ))}

        {/* In progress milestones */}
        {inProgressMilestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sq-sm"
          >
            <span className="text-slate-400">{milestone.icon}</span>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {milestone.title}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-slate-400 font-medium ml-1">
              In progress
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};