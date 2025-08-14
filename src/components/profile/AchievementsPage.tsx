import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Trophy, Star, Calendar, Medal, Target, Zap, Award, Crown, Gem, Shield, Sword, Lock, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp: number;
  isUnlocked: boolean;
}

interface AchievementsPageProps {
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
}

const AchievementsPage: React.FC<AchievementsPageProps> = ({
  userId,
  userDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser
}) => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample achievements data - this would come from your database
  const achievements: Achievement[] = [
    {
      id: '1',
      name: '20 Club',
      description: 'Play 20 top-rated golf courses',
      icon: '🏌️',
      color: '#FFD700',
      category: 'Courses',
      unlockedAt: '2024-01-15',
      progress: 20,
      maxProgress: 20,
      rarity: 'common',
      xp: 100,
      isUnlocked: true
    },
    {
      id: '2',
      name: '50 Club',
      description: 'Play 50 top-rated golf courses',
      icon: '⭐',
      color: '#C0C0C0',
      category: 'Courses',
      unlockedAt: '2024-02-20',
      progress: 50,
      maxProgress: 50,
      rarity: 'rare',
      xp: 250,
      isUnlocked: true
    },
    {
      id: '3',
      name: 'Century Club',
      description: 'Play 100 top-rated golf courses',
      icon: '💙',
      color: '#1E90FF',
      category: 'Courses',
      progress: 87,
      maxProgress: 100,
      rarity: 'epic',
      xp: 500,
      isUnlocked: false
    },
    {
      id: '4',
      name: 'Eagle Collector',
      description: 'Score 25 eagles in ranked rounds',
      icon: '🦅',
      color: '#8B4513',
      category: 'Performance',
      unlockedAt: '2024-03-10',
      progress: 25,
      maxProgress: 25,
      rarity: 'epic',
      xp: 400,
      isUnlocked: true
    },
    {
      id: '5',
      name: 'Par Machine',
      description: 'Score par or better on 100 consecutive holes',
      icon: '⚙️',
      color: '#4169E1',
      category: 'Performance',
      progress: 73,
      maxProgress: 100,
      rarity: 'rare',
      xp: 300,
      isUnlocked: false
    },
    {
      id: '6',
      name: 'World Traveler',
      description: 'Play courses in 10 different countries',
      icon: '🌍',
      color: '#32CD32',
      category: 'Travel',
      unlockedAt: '2024-01-28',
      progress: 12,
      maxProgress: 10,
      rarity: 'rare',
      xp: 350,
      isUnlocked: true
    },
    {
      id: '7',
      name: 'Social Butterfly',
      description: 'Play rounds with 50 different players',
      icon: '🦋',
      color: '#FF69B4',
      category: 'Social',
      progress: 34,
      maxProgress: 50,
      rarity: 'common',
      xp: 200,
      isUnlocked: false
    },
    {
      id: '8',
      name: 'Legend Status',
      description: 'Achieve single-digit handicap',
      icon: '👑',
      color: '#FFD700',
      category: 'Handicap',
      progress: 4.2,
      maxProgress: 9.9,
      rarity: 'legendary',
      xp: 1000,
      isUnlocked: true
    }
  ];

  const categories = [
    { id: 'all', label: 'All', icon: Trophy },
    { id: 'Courses', label: 'Courses', icon: Target },
    { id: 'Performance', label: 'Performance', icon: Star },
    { id: 'Travel', label: 'Travel', icon: Medal },
    { id: 'Social', label: 'Social', icon: User },
    { id: 'Handicap', label: 'Handicap', icon: Crown }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-300';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-50';
      case 'rare': return 'bg-blue-50';
      case 'epic': return 'bg-purple-50';
      case 'legendary': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.isUnlocked).length,
    totalXP: achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.xp, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Achievements</h2>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.unlocked}</div>
            <div>Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div>Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalXP}</div>
            <div>XP Earned</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            onClick={() => {
              setSelectedAchievement(achievement);
              setShowDetailModal(true);
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
              achievement.isUnlocked 
                ? `${getRarityColor(achievement.rarity)} ${getRarityBg(achievement.rarity)}` 
                : 'border-gray-300 bg-gray-100 opacity-60'
            }`}
          >
            {/* Achievement Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 text-3xl rounded-full bg-white border-2 border-current">
              {achievement.isUnlocked ? achievement.icon : <Lock className="h-6 w-6 text-gray-400" />}
            </div>

            {/* Achievement Info */}
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">{achievement.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

              {/* Progress Bar (for locked achievements) */}
              {!achievement.isUnlocked && achievement.progress !== undefined && achievement.maxProgress && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Rarity Badge */}
              <div className="flex items-center justify-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  achievement.rarity === 'common' ? 'bg-gray-200 text-gray-800' :
                  achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                  achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                </span>
                {achievement.isUnlocked && (
                  <span className="text-xs text-muted-foreground">+{achievement.xp} XP</span>
                )}
              </div>

              {/* Unlock Date */}
              {achievement.isUnlocked && achievement.unlockedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No achievements found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          achievement={{
            id: selectedAchievement.id,
            name: selectedAchievement.name,
            description: selectedAchievement.description,
            xp: selectedAchievement.xp,
            unlocked: selectedAchievement.isUnlocked,
            dateEarned: selectedAchievement.unlockedAt,
            progress: selectedAchievement.progress ? `${selectedAchievement.progress}/${selectedAchievement.maxProgress}` : undefined,
            unlockHint: !selectedAchievement.isUnlocked ? "Keep playing to unlock this achievement!" : undefined
          }}
        />
      )}
    </div>
  );
};

export default AchievementsPage;