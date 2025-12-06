import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { useUserAchievements, UserAchievement } from '@/hooks/useUserAchievements';
import { getTop100Club } from '@/lib/top100Club';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';

/**
 * ProfileAchievementsPage - Strava-style Trophy Case
 * Sections: Skills, Exploration, Social
 */
const ProfileAchievementsPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useUserByUsername(username);
  const { data: achievements = [], isLoading } = useUserAchievements(user?.id);

  // Group achievements by category
  const skillAchievements = useMemo(
    () => achievements.filter(a => a.category === 'skill'),
    [achievements]
  );
  const explorationAchievements = useMemo(
    () => achievements.filter(a => a.category === 'exploration'),
    [achievements]
  );
  const socialAchievements = useMemo(
    () => achievements.filter(a => a.category === 'social'),
    [achievements]
  );
  const otherAchievements = useMemo(
    () => achievements.filter(a => 
      a.category !== 'skill' && a.category !== 'exploration' && a.category !== 'social'
    ),
    [achievements]
  );

  const renderAchievementCard = (ach: UserAchievement) => {
    const clubResult = getTop100Club(ach.points || 0);
    const ringColor = clubResult.ringColor;
    const isLocked = !ach.isUnlocked;
    
    return (
      <div
        key={ach.achievementId}
        id={ach.code}
        className={`flex flex-col items-center rounded-sq-md bg-background/60 px-3 py-4 text-center shadow-sm ring-1 ring-black/5 ${
          isLocked ? 'opacity-50' : ''
        }`}
      >
        <div 
          className="flex h-14 w-14 items-center justify-center rounded-full mb-2"
          style={{ backgroundColor: isLocked ? 'hsl(var(--muted))' : `${ringColor}20` }}
        >
          {isLocked ? (
            <Lock className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Trophy 
              className="h-7 w-7" 
              style={{ color: ringColor }}
            />
          )}
        </div>
        <span className="text-[11px] font-medium leading-tight text-foreground">
          {ach.name}
        </span>
        <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
          {ach.description}
        </span>
        {ach.isUnlocked && ach.unlockedAt && (
          <span className="text-[9px] text-muted-foreground mt-1">
            {new Date(ach.unlockedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  const renderSection = (title: string, items: UserAchievement[], id: string) => {
    if (items.length === 0) return null;
    
    return (
      <section className="mt-6" aria-labelledby={`${id}-heading`}>
        <h2
          id={`${id}-heading`}
          className="mb-3 text-sm font-semibold text-foreground"
        >
          {title}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {items.map(renderAchievementCard)}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <div className="mx-auto flex w-full max-w-screen-sm flex-col px-4 pb-10 pt-20">
        {/* Page header */}
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              Achievements
            </h1>
            {username && (
              <p className="text-xs text-muted-foreground">@{username}</p>
            )}
          </div>
        </div>

        {(isLoading || userLoading) && (
          <p className="text-sm text-muted-foreground">
            Loading achievements…
          </p>
        )}

        {!isLoading && !userLoading && achievements.length === 0 && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No achievements unlocked yet. Play more Top 100 courses and complete rounds to start filling this page.
            </p>
          </div>
        )}

        {/* Skill achievements */}
        {renderSection('Skill achievements', skillAchievements, 'skills')}

        {/* Exploration achievements */}
        {renderSection('Exploration', explorationAchievements, 'exploration')}

        {/* Social achievements */}
        {renderSection('Social', socialAchievements, 'social')}

        {/* Other achievements */}
        {renderSection('Other', otherAchievements, 'other')}
      </div>
    </div>
  );
};

export default ProfileAchievementsPage;
