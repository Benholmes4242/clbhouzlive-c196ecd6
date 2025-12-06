import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserAchievements, UserAchievement } from '@/hooks/useUserAchievements';
import { getTop100Club } from '@/lib/top100Club';

interface ProfileAchievementsRailProps {
  userId: string;
  username: string;
  className?: string;
}

const MAX_VISIBLE = 8;

/**
 * ProfileAchievementsRail - Strava-style horizontal trophy strip
 * Shows up to 8 most important achievements
 */
const ProfileAchievementsRail: React.FC<ProfileAchievementsRailProps> = ({
  userId,
  username,
  className,
}) => {
  const navigate = useNavigate();
  const { data: achievements = [], isLoading } = useUserAchievements(userId);

  const visible = useMemo(() => {
    if (!achievements.length) return [];
    
    // Prioritize by category: skill first, then exploration, then social
    const skill = achievements.filter(a => a.category === 'skill');
    const exploration = achievements.filter(a => a.category === 'exploration');
    const social = achievements.filter(a => a.category === 'social');
    const other = achievements.filter(a => 
      a.category !== 'skill' && a.category !== 'exploration' && a.category !== 'social'
    );

    const ordered: UserAchievement[] = [
      ...skill,
      ...exploration,
      ...social,
      ...other,
    ];

    // Only show unlocked achievements
    return ordered
      .filter(a => a.isUnlocked)
      .slice(0, MAX_VISIBLE);
  }, [achievements]);

  if (isLoading || visible.length === 0) return null;

  return (
    <section
      className={cn("mt-4 px-4", className)}
      aria-label="Achievements"
    >
      {/* Title row */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Achievements
        </h2>

        <button
          type="button"
          onClick={() => navigate(`/profile/${username}/achievements`)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] scrollbar-hide">
        {visible.map(ach => {
          // Get color based on points/tier - use club tier system
          const clubResult = getTop100Club(ach.points || 0);
          const ringColor = clubResult.ringColor;
          
          return (
            <button
              key={ach.achievementId}
              type="button"
              onClick={() => navigate(`/profile/${username}/achievements#${ach.code}`)}
              className="flex min-w-[110px] max-w-[130px] flex-col items-center rounded-sq-md bg-background/60 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:bg-background/80 transition-colors"
            >
              {/* Badge icon */}
              <div 
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${ringColor}20` }}
              >
                <Trophy 
                  className="h-5 w-5" 
                  style={{ color: ringColor }}
                />
              </div>
              <span className="truncate w-full text-center text-[11px] font-medium text-foreground/80">
                {ach.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileAchievementsRail;
