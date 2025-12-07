import React, { useState } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { achievementGlassTint } from '@/lib/achievementDefinitions';
import MilestonesAndAchievementsModal from '@/components/achievements/MilestonesAndAchievementsModal';

interface ProfileAchievementsRailProps {
  userId: string;
  username: string;
  className?: string;
}

const MAX_VISIBLE = 10;

/**
 * ProfileAchievementsRail - Strava-style horizontal trophy strip
 * Shows all unlocked milestone and list completion achievements
 * Business rule: Users keep and display ALL earned badges, not just highest
 */
const ProfileAchievementsRail: React.FC<ProfileAchievementsRailProps> = ({
  userId,
  username,
  className,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: achievements, isLoading } = useProfileAchievements(userId);

  // Sort by newest first: use unlockedAt date if available, else higher thresholds first
  // This shows most recently earned achievements on the left
  const sortedAchievements = [...achievements].sort((a, b) => {
    // First, sort by unlock date (newest first) if available
    const aDate = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
    const bDate = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
    if (aDate !== bDate) return bDate - aDate;
    
    // Fallback: higher thresholds (bigger milestones) first
    const aVal = a.threshold ?? 0;
    const bVal = b.threshold ?? 0;
    return bVal - aVal;
  });

  // Cap visible to MAX_VISIBLE
  const visible = sortedAchievements.slice(0, MAX_VISIBLE);

  if (isLoading || visible.length === 0) return null;

  return (
    <>
      <section
        className={cn("px-4", className)}
        aria-label="Achievements"
      >
        {/* Title row */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Achievements
          </h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Horizontal scroll strip */}
        <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] scrollbar-hide -mx-4 px-4">
          {visible.map(ach => (
            <div
              key={ach.id}
              className="flex min-w-[120px] max-w-[140px] flex-col items-center rounded-sq-md px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-md"
              style={{
                background: achievementGlassTint(ach.ringColor, ach.glassIntensity),
              }}
            >
              {/* Badge icon */}
              <div 
                className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ 
                  backgroundColor: `${ach.ringColor}30`,
                  border: `2px solid ${ach.ringColor}`,
                }}
              >
                <Trophy 
                  className="h-5 w-5" 
                  style={{ color: ach.ringColor }}
                />
              </div>
              
              {/* Achievement label */}
              <span 
                className="truncate w-full text-center text-[11px] font-semibold"
                style={{ color: ach.ringColor }}
              >
                {ach.shortLabel}
              </span>
              <span className="truncate w-full text-center text-[10px] text-foreground/60">
                {ach.type === 'milestone' ? 'Milestone' : 'Completed'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements Modal */}
      <MilestonesAndAchievementsModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
};

export default ProfileAchievementsRail;
