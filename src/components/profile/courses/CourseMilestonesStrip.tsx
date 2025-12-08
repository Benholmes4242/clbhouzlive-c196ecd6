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
  // Define milestones with thresholds for "to go" calculation
  const getMilestoneData = () => {
    const courseMilestones = [10, 25, 50, 100];
    const countryMilestones = [2, 5, 10];
    const seasonMilestones = [3, 5, 10];

    const milestones: (Milestone & { threshold?: number; current?: number })[] = [];

    // Course milestones
    courseMilestones.forEach(threshold => {
      const isUnlocked = totalCoursesPlayed >= threshold;
      const toGo = Math.max(0, threshold - totalCoursesPlayed);
      milestones.push({
        id: `${threshold}-courses`,
        title: `${threshold} courses played`,
        icon: threshold >= 50 ? <Trophy className="w-3 h-3" /> : <MapPin className="w-3 h-3" />,
        isUnlocked,
        threshold,
        current: totalCoursesPlayed,
      });
    });

    // Country milestones
    countryMilestones.forEach(threshold => {
      const isUnlocked = countriesPlayed >= threshold;
      milestones.push({
        id: `${threshold}-countries`,
        title: threshold === 2 ? 'First overseas round' : `${threshold} countries played`,
        icon: <Globe className="w-3 h-3" />,
        isUnlocked,
        threshold,
        current: countriesPlayed,
      });
    });

    // Season milestones
    seasonMilestones.forEach(threshold => {
      const isUnlocked = newCoursesThisYear >= threshold;
      milestones.push({
        id: `${threshold}-new-season`,
        title: `${threshold} new courses this season`,
        icon: <Flag className="w-3 h-3" />,
        isUnlocked,
        threshold,
        current: newCoursesThisYear,
      });
    });

    return milestones;
  };

  const milestones = getMilestoneData();

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
            <span className="text-[9px] text-amber-600/80 font-medium ml-1">
              • Unlocked
            </span>
          </div>
        ))}

        {/* In progress milestones with "X to go" */}
        {inProgressMilestones.map((milestone: any) => {
          const toGo = milestone.threshold && milestone.current !== undefined 
            ? Math.max(0, milestone.threshold - milestone.current)
            : null;
          
          return (
            <div
              key={milestone.id}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sq-sm"
            >
              <span className="text-slate-400">{milestone.icon}</span>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {milestone.title}
              </span>
              <span className="text-[9px] text-slate-400 font-medium ml-1">
                • {toGo !== null ? `${toGo} to go` : 'In progress'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};