import React from 'react';
import { Users } from 'lucide-react';

interface BadgeCardsProps {
  userId: string;
}

const BadgeCards: React.FC<BadgeCardsProps> = ({ userId }) => {
  // Mock badges data with tier system
  const badges = [
    {
      id: '1',
      title: '20 Club',
      subtitle: 'Rated 50 Top 100 Courses',
      progress: 21,
      total: 100,
      tier: 'bronze',
      icon: '🏆',
      color: 'from-orange-400 to-orange-600',
      friends: ['@Tom', '@Sarah']
    },
    {
      id: '2',
      title: '50 Club',
      subtitle: 'Rated 50 Top 100 Courses',
      progress: 50,
      total: 100,
      tier: 'silver',
      icon: '🏆',
      color: 'from-blue-400 to-blue-600',
      friends: ['@Mike']
    },
    {
      id: '3',
      title: '75 Club',
      subtitle: 'Rated 75 Top 100 Courses',
      progress: 75,
      total: 100,
      tier: 'gold',
      icon: '🏆',
      color: 'from-yellow-400 to-yellow-600',
      friends: []
    },
    {
      id: '4',
      title: '200 Club',
      subtitle: 'Rater 200 Golf Courses',
      progress: 200,
      total: 300,
      tier: 'emerald',
      icon: '🏆',
      color: 'from-emerald-400 to-emerald-600',
      friends: []
    }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-orange-400 to-orange-600';
      case 'silver': return 'from-slate-400 to-slate-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'emerald': return 'from-emerald-400 to-emerald-600';
      case 'diamond': return 'from-blue-400 to-blue-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h2 className="text-2xl font-bold text-foreground">Badges & Achievements</h2>
      
      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              {/* Left: Icon and Info */}
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getTierColor(badge.tier)} flex items-center justify-center text-2xl`}>
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {badge.subtitle}
                  </p>
                  
                  {/* Friends who also have this badge */}
                  {badge.friends.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
                      <Users className="w-3 h-3" />
                      <span>
                        Also earned by {badge.friends.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getTierColor(badge.tier)}`}
                      style={{ width: `${Math.min((badge.progress / badge.total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right: Progress Pill */}
              <div className="bg-muted rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                {badge.progress}/{badge.total}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeCards;