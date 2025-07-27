
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Camera, MapPin, Users, Target, Calendar } from 'lucide-react';

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

const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  isOwnProfile
}) => {
  const getAchievementIcon = (type: Achievement['type']) => {
    switch (type) {
      case 'first_top100':
        return <Trophy className="h-5 w-5" />;
      case 'first_snap':
        return <Camera className="h-5 w-5" />;
      case 'courses_milestone':
        return <Target className="h-5 w-5" />;
      case 'regions_explorer':
        return <MapPin className="h-5 w-5" />;
      case 'yearly_goal':
        return <Calendar className="h-5 w-5" />;
      case 'social_milestone':
        return <Users className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const inProgressAchievements = achievements.filter(a => !a.isUnlocked && a.progress);

  if (achievements.length === 0) {
    return null;
  }

  return (
    <Card className="!bg-black/40 backdrop-blur-sm !border-black/20 rounded-lg">
      <CardContent className="p-6">
         <div className="flex items-center gap-2 mb-4">
           <Trophy className="h-5 w-5 text-yellow-400" />
           <h3 className="font-semibold text-lg text-white">Achievements</h3>
           <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/20">
             {unlockedAchievements.length}/{achievements.length}
           </Badge>
         </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-white/80 mb-3">Unlocked</h4>
            <div className="flex flex-wrap gap-2">
              {unlockedAchievements.map((achievement) => (
                <Badge
                  key={achievement.id}
                  className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 hover:bg-yellow-400/30 transition-colors p-2 flex items-center gap-2"
                  title={achievement.description}
                >
                  {getAchievementIcon(achievement.type)}
                  <span className="text-xs font-medium">{achievement.title}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Achievements */}
        {inProgressAchievements.length > 0 && isOwnProfile && (
          <div>
            <h4 className="font-medium text-sm text-white/80 mb-3">In Progress</h4>
            <div className="space-y-2">
              {inProgressAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20"
                >
                  <div className="text-white/60">
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{achievement.title}</p>
                    {achievement.progress && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-white/80">
                          {achievement.progress.current}/{achievement.progress.target}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsSection;
