import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { useProfileAchievements } from '@/hooks/useProfileAchievements';
import { 
  MILESTONE_ACHIEVEMENTS, 
  LIST_ACHIEVEMENTS,
  achievementGlassTint,
  type AchievementDefinition 
} from '@/lib/achievementDefinitions';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';

/**
 * ProfileAchievementsPage - Strava-style Trophy Case
 * Shows all milestone and list completion achievements
 * Milestones displayed with unlock status based on Top 100 count
 */
const ProfileAchievementsPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useUserByUsername(username);
  const { data: unlocked, isLoading, totalPlayed } = useProfileAchievements(user?.id);

  // Create sets for quick lookup
  const unlockedIds = new Set(unlocked.map(a => a.id));

  // All milestones with unlock status
  const milestones = MILESTONE_ACHIEVEMENTS.map(m => ({
    ...m,
    isUnlocked: unlockedIds.has(m.id),
  }));

  // All list completions with unlock status
  const lists = LIST_ACHIEVEMENTS.map(l => ({
    ...l,
    isUnlocked: unlockedIds.has(l.id),
  }));

  // Count unlocked
  const unlockedCount = unlocked.length;

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <div className="mx-auto flex w-full max-w-screen-sm flex-col px-4 pb-10 pt-20">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
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
              <p className="text-xs text-muted-foreground">
                @{username} • {totalPlayed} Top 100 courses played • {unlockedCount} unlocked
              </p>
            )}
          </div>
        </div>

        {(isLoading || userLoading) && (
          <p className="text-sm text-muted-foreground">
            Loading achievements…
          </p>
        )}

        {/* Milestones Section */}
        <section className="mb-8" aria-labelledby="milestones-heading">
          <h2
            id="milestones-heading"
            className="mb-3 text-sm font-semibold text-foreground"
          >
            Top 100 Milestones
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {milestones.map(m => (
              <AchievementCard 
                key={m.id} 
                achievement={m} 
                isUnlocked={m.isUnlocked} 
              />
            ))}
          </div>
        </section>

        {/* List Completions Section */}
        <section aria-labelledby="lists-heading">
          <h2
            id="lists-heading"
            className="mb-3 text-sm font-semibold text-foreground"
          >
            Top 100 Lists Completed
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {lists.map(l => (
              <AchievementCard 
                key={l.id} 
                achievement={l} 
                isUnlocked={l.isUnlocked} 
              />
            ))}
          </div>
        </section>

        {/* Empty state */}
        {!isLoading && !userLoading && unlockedCount === 0 && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No achievements unlocked yet. Play more Top 100 courses to start earning badges!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AchievementCardProps {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
}

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  return (
    <div
      id={achievement.id}
      className={`flex flex-col items-center rounded-sq-md px-2 py-3 text-center shadow-sm ring-1 transition-all ${
        isUnlocked 
          ? 'ring-black/10' 
          : 'ring-black/5 opacity-40 grayscale'
      }`}
      style={{
        background: isUnlocked 
          ? achievementGlassTint(achievement.ringColor, achievement.glassIntensity)
          : 'rgba(0,0,0,0.03)',
      }}
    >
      {/* Badge icon */}
      <div 
        className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ 
          backgroundColor: isUnlocked ? `${achievement.ringColor}25` : 'rgba(0,0,0,0.05)',
          border: `2px solid ${isUnlocked ? achievement.ringColor : '#ccc'}`,
        }}
      >
        <Trophy 
          className="h-6 w-6" 
          style={{ color: isUnlocked ? achievement.ringColor : '#aaa' }}
        />
      </div>
      
      {/* Labels */}
      <span 
        className="text-xs font-semibold leading-tight"
        style={{ color: isUnlocked ? achievement.ringColor : '#888' }}
      >
        {achievement.shortLabel}
      </span>
      <span className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
        {achievement.label}
      </span>
      
      {/* Status */}
      <span className={`mt-1.5 text-[9px] uppercase tracking-wide ${
        isUnlocked ? 'text-foreground/60' : 'text-muted-foreground'
      }`}>
        {isUnlocked ? '✓ Unlocked' : 'Locked'}
      </span>
    </div>
  );
}

export default ProfileAchievementsPage;
