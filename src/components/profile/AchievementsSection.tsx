
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-lg">Achievements</h3>
          <Badge variant="secondary" className="ml-auto">
            {unlockedAchievements.length}/{achievements.length}
          </Badge>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-gray-700 mb-3">Unlocked</h4>
            <div className="flex flex-wrap gap-2">
              {unlockedAchievements.map((achievement) => (
                <Badge
                  key={achievement.id}
                  className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 transition-colors p-2 flex items-center gap-2"
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
            <h4 className="font-medium text-sm text-gray-700 mb-3">In Progress</h4>
            <div className="space-y-2">
              {inProgressAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="text-gray-400">
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{achievement.title}</p>
                    {achievement.progress && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#b66b41] h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
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
