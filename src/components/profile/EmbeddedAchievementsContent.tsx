// EmbeddedAchievementsContent - Embedded version without Dialog wrapper
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface EmbeddedAchievementsContentProps {
  userId?: string;
  userDisplayName?: string;
  userHandicap?: string | number;
  userProfilePhotoUrl?: string;
  isCurrentUser?: boolean;
}

interface Achievement {
  title: string;
  emoji: string;
  isEarned: boolean;
  description: string;
  xp: number;
  isRepeatable: boolean;
  progress?: string;
  dateEarned?: string;
  unlockHint?: string;
}

interface AchievementModalData {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
  unlockHint?: string;
  progress?: string;
  dateEarned?: string;
  isRepeatable?: boolean;
}

const EmbeddedAchievementsContent: React.FC<EmbeddedAchievementsContentProps> = ({
  userId,
  userDisplayName = "User",
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  console.log('EmbeddedAchievementsContent rendering');
  
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'exploration' | 'skill'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementModalData | null>(null);
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);
  
  // Mock data
  const totalXP = 2500;

  // Animation trigger when component loads
  useEffect(() => {
    const timer = setTimeout(() => setAnimateProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Sample achievements
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🟡",
      isEarned: true,
      description: "Play 20 of the world's greatest golf courses",
      xp: 150,
      isRepeatable: false,
      dateEarned: "2024-02-15"
    },
    {
      title: "50 Club",
      emoji: "🥈",
      isEarned: true,
      description: "Play 50 of the world's greatest golf courses",
      xp: 250,
      isRepeatable: false,
      dateEarned: "2024-08-01"
    }
  ];

  const skillAchievements: Achievement[] = [
    {
      title: "Single-Figure Handicap",
      emoji: "🎯",
      isEarned: true,
      description: "Achieve a single-figure handicap",
      xp: 150,
      isRepeatable: false,
      dateEarned: "2024-02-08"
    }
  ];

  // Helper function to get filtered achievements
  const getFilteredAchievements = (achievements: Achievement[], category: string) => {
    let filtered = achievements;
    
    switch (activeFilter) {
      case 'unlocked':
        filtered = achievements.filter(a => a.isEarned);
        break;
      case 'locked':
        filtered = achievements.filter(a => !a.isEarned);
        break;
      case 'exploration':
        filtered = category === 'exploration' ? achievements : [];
        break;
      case 'skill':
        filtered = category === 'skill' ? achievements : [];
        break;
      case 'all':
      default:
        filtered = achievements;
        break;
    }
    
    return filtered;
  };

  // Get most recently unlocked achievement
  const getMostRecentAchievement = () => {
    const allAchievements = [...explorationAchievements, ...skillAchievements];
    const unlockedAchievements = allAchievements.filter(a => a.isEarned && a.dateEarned);
    
    if (unlockedAchievements.length === 0) return null;
    
    unlockedAchievements.sort((a, b) => {
      const dateA = new Date(a.dateEarned!);
      const dateB = new Date(b.dateEarned!);
      return dateB.getTime() - dateA.getTime();
    });
    
    return unlockedAchievements[0];
  };

  const mostRecentAchievement = getMostRecentAchievement();

  return (
    <div className="w-full bg-background">
      <div className={`${isMobile ? 'px-4 py-6' : 'px-8 py-8'} w-full`}>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Achievements</h1>
            <h2 className="text-lg md:text-xl text-muted-foreground">Defining your game through achievement</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {userProfilePhotoUrl ? (
              <img 
                src={userProfilePhotoUrl} 
                alt={userDisplayName}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">
                  {userDisplayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground">{userDisplayName}</div>
              <div className="text-sm text-muted-foreground">
                {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full pb-20">
        {/* XP Progress Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm pt-4 pb-4">
          <div className={`${isMobile ? 'px-4' : 'px-8'} flex items-center justify-between`}>
            <div className="flex items-center space-x-4">
              <div className="text-left">
                <div className="text-sm text-muted-foreground font-medium">XP Progress</div>
                <div className="text-3xl font-bold text-foreground">
                  {totalXP.toLocaleString()} XP
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 h-auto"
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>

          {!isCollapsed && (
            <div className={`${isMobile ? 'px-4 mt-4' : 'px-8 mt-6'} flex flex-col lg:flex-row gap-6 lg:gap-12 items-center justify-center`}>
              <div className="flex-shrink-0">
                <XPRingSystem 
                  currentXP={totalXP}
                  size={isMobile ? 'small' : 'medium'}
                />
              </div>

              {mostRecentAchievement && (
                <div className="flex flex-col items-center text-center lg:max-w-md">
                  <div className="w-48 h-48 text-8xl flex items-center justify-center drop-shadow-lg mb-4">
                    {mostRecentAchievement.emoji}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    {mostRecentAchievement.title}
                  </h3>
                  <div className="text-lg text-muted-foreground flex items-center gap-2">
                    <span className="text-lg font-semibold text-primary">+{mostRecentAchievement.xp} XP</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Unlocked {new Date(mostRecentAchievement.dateEarned!).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className={`${isMobile ? 'px-4 py-4' : 'px-8 py-6'} flex flex-wrap gap-2 justify-center sticky top-[120px] z-[5] bg-background/95 backdrop-blur-sm`}>
          {[
            { id: 'all', label: 'All' },
            { id: 'unlocked', label: 'Unlocked' },
            { id: 'locked', label: 'Locked' },
            { id: 'exploration', label: 'Exploration' },
            { id: 'skill', label: 'Skill' }
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.id as any)}
              className="rounded-full"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Achievements Content */}
        <div className={`${isMobile ? 'px-4' : 'px-8'} space-y-8`}>
          {/* Exploration Achievements */}
          {(activeFilter === 'all' || activeFilter === 'exploration' || activeFilter === 'unlocked' || activeFilter === 'locked') && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Exploration Achievements
              </h2>
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'
              }`}>
                {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement, index) => (
                  <div
                    key={achievement.title}
                    className={`relative p-6 rounded-lg border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      achievement.isEarned 
                        ? 'bg-card border-primary/20 shadow-sm' 
                        : 'bg-muted/30 border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl ${achievement.isEarned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                        {achievement.emoji}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.isEarned ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">+{achievement.xp} XP</span>
                        </div>
                      </div>
                    </div>
                    {achievement.isEarned && achievement.dateEarned && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Unlocked {new Date(achievement.dateEarned).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Achievements */}
          {(activeFilter === 'all' || activeFilter === 'skill' || activeFilter === 'unlocked' || activeFilter === 'locked') && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Skill Achievements
              </h2>
              <div className={`grid gap-4 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'
              }`}>
                {getFilteredAchievements(skillAchievements, 'skill').map((achievement, index) => (
                  <div
                    key={achievement.title}
                    className={`relative p-6 rounded-lg border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      achievement.isEarned 
                        ? 'bg-card border-primary/20 shadow-sm' 
                        : 'bg-muted/30 border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl ${achievement.isEarned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                        {achievement.emoji}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${achievement.isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.isEarned ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">+{achievement.xp} XP</span>
                        </div>
                      </div>
                    </div>
                    {achievement.isEarned && achievement.dateEarned && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Unlocked {new Date(achievement.dateEarned).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          isOpen={showAchievementDetailModal}
          onClose={() => {
            setShowAchievementDetailModal(false);
            setSelectedAchievement(null);
          }}
        />
      )}
    </div>
  );
};

export default EmbeddedAchievementsContent;