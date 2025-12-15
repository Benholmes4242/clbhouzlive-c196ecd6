import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Camera, MapPin, Users, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTierPalette } from '@/lib/globalAchievementMilestoneSystem';

interface Achievement {
  id: string;
  type: 'first_top100' | 'first_snap' | 'courses_milestone' | 'regions_explorer' | 'yearly_goal' | 'social_milestone';
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt?: string;
  isUnlocked: boolean;
  progress?: {
    current: number;
    target: number;
  };
}

interface AchievementsSectionProps {
  achievements: Achievement[];
  isOwnProfile: boolean;
}

// Map achievement types to tier colors
const getAchievementTier = (type: Achievement['type']): string => {
  switch (type) {
    case 'first_top100':
      return '100';
    case 'first_snap':
      return '5';
    case 'courses_milestone':
      return '50';
    case 'regions_explorer':
      return '200';
    case 'yearly_goal':
      return '20';
    case 'social_milestone':
      return '10';
    default:
      return '5';
  }
};

const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  isOwnProfile
}) => {
  const getAchievementIcon = (type: Achievement['type']) => {
    switch (type) {
      case 'first_top100':
        return <Trophy className="h-4 w-4" />;
      case 'first_snap':
        return <Camera className="h-4 w-4" />;
      case 'courses_milestone':
        return <Target className="h-4 w-4" />;
      case 'regions_explorer':
        return <MapPin className="h-4 w-4" />;
      case 'yearly_goal':
        return <Calendar className="h-4 w-4" />;
      case 'social_milestone':
        return <Users className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const inProgressAchievements = achievements.filter(a => !a.isUnlocked && a.progress);

  if (achievements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-lg">Achievements</h3>
          <span className="ml-auto text-sm text-muted-foreground">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Unlocked</h4>
            <div className="flex flex-wrap gap-2">
              {unlockedAchievements.map((achievement) => {
                const tier = getAchievementTier(achievement.type);
                const palette = getTierPalette(tier, true);
                
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "rounded-sq-sm px-3 py-1.5 flex items-center gap-2 transition-colors duration-300",
                      "hover:bg-white/5"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${palette.bgLight}, ${palette.bgDark})`,
                    }}
                    title={achievement.description}
                  >
                    <span className="text-slate-900 opacity-55">
                      {getAchievementIcon(achievement.type)}
                    </span>
                    <span className="text-xs font-medium text-slate-900">
                      {achievement.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In Progress Achievements */}
        {inProgressAchievements.length > 0 && isOwnProfile && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">In Progress</h4>
            <div className="space-y-2">
              {inProgressAchievements.map((achievement) => {
                const tier = getAchievementTier(achievement.type);
                const palette = getTierPalette(tier, false);
                
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 rounded-sq-sm border transition-colors duration-300"
                    style={{
                      background: palette.bgLocked,
                    }}
                  >
                    <div className="text-[rgba(255,255,255,0.42)]">
                      {getAchievementIcon(achievement.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[rgba(255,255,255,0.78)]">{achievement.title}</p>
                      {achievement.progress && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%`,
                                background: `linear-gradient(90deg, ${palette.bgLight}, ${palette.bgDark})`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[rgba(255,255,255,0.55)]">
                            {achievement.progress.current}/{achievement.progress.target}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsSection;
