// AchievementsPane - Complete inline achievements for Profile page with redesigned layout
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Trophy, Share2, ArrowUp, TrendingUp, Lock } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface AchievementsPaneProps {
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

const AchievementsPane: React.FC<AchievementsPaneProps> = ({
  userId,
  userDisplayName = "User",
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'exploration' | 'skill'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementModalData | null>(null);
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);
  const [animateXP, setAnimateXP] = useState(0);
  
  // XP and Ring Data
  const totalXP = 7500;
  const nextRingXP = 10000;
  const currentMonth = "August";
  const xpThisMonth = 75;
  const progressPercentage = (totalXP / nextRingXP) * 100;
  
  // XP Ring Tiers
  const xpTiers = [
    { name: "Blue Ring", color: "#3B82F6", minXP: 10000, locked: totalXP < 10000 },
    { name: "Green Ring", color: "#10B981", minXP: 20000, locked: totalXP < 20000 },
    { name: "Silver Ring", color: "#6B7280", minXP: 30000, locked: totalXP < 30000 },
    { name: "Gold Ring", color: "#F59E0B", minXP: 40000, locked: totalXP < 40000 }
  ];

  // Animate XP number on load
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();
    
    const animateNumber = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setAnimateXP(Math.floor(easeOutQuart * totalXP));
      
      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      }
    };
    
    requestAnimationFrame(animateNumber);
  }, [totalXP]);

  // Mock achievements data
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏆",
      isEarned: true,
      description: "Play 20 of the world's top courses",
      xp: 200,
      isRepeatable: false,
      progress: "20/20",
      dateEarned: "2025-07-15"
    },
    {
      title: "50 Club", 
      emoji: "⭐",
      isEarned: true,
      description: "Play 50 of the world's top courses",
      xp: 300,
      isRepeatable: false,
      progress: "50/50",
      dateEarned: "2025-08-08"
    },
    {
      title: "100 Century Club",
      emoji: "👑",
      isEarned: false,
      description: "Play 100 of the world's top courses",
      xp: 500,
      isRepeatable: false,
      progress: "67/100",
      unlockHint: "Keep exploring the world's best courses!"
    }
  ];

  const skillAchievements: Achievement[] = [
    {
      title: "Birdie Blitz",
      emoji: "🐦", 
      isEarned: true,
      description: "Score 3 birdies in a single round",
      xp: 75,
      isRepeatable: false,
      progress: "3/3",
      dateEarned: "2025-08-08"
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Score an eagle on any hole",
      xp: 150,
      isRepeatable: false,
      progress: "0/1",
      unlockHint: "Go for those long par 5s!"
    }
  ];

  // Get most recent achievement
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

  const recentAchievement = getMostRecentAchievement();

  // Filter achievements
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

  // Get filter counts
  const getFilterCounts = () => {
    const allAchievements = [...explorationAchievements, ...skillAchievements];
    return {
      all: allAchievements.length,
      unlocked: allAchievements.filter(a => a.isEarned).length,
      locked: allAchievements.filter(a => !a.isEarned).length,
      exploration: explorationAchievements.length,
      skill: skillAchievements.length
    };
  };

  const filterCounts = getFilterCounts();

  // Helper function to get achievement badge image
  const getAchievementIcon = (achievement: Achievement) => {
    const size = isMobile ? "w-16 h-16" : "w-20 h-20";
    
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className={size} />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className={size} />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className={size} />;
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className={size} />;
      default:
        return (
          <div className={`${size} text-3xl flex items-center justify-center bg-muted rounded-full border-2 border-border`}>
            {achievement.emoji}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground">Defining your game through achievement</p>
      </div>

      {/* XP Progress Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">XP Progress</h2>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">{animateXP.toLocaleString()} XP</div>
          </div>
        </div>

        <div className={`flex ${isMobile ? 'flex-col items-center space-y-4' : 'items-center justify-center gap-8'}`}>
          {/* Large XP Ring */}
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="transparent"
              />
              
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#22c55e"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progressPercentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.4))'
                }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-foreground">
                {animateXP.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 font-semibold">
                XP to next ring
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>

          {/* Ring Status */}
          <div className="text-center space-y-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">No Ring Achieved</h3>
              <p className="text-sm text-muted-foreground">
                Reach {nextRingXP.toLocaleString()} XP to unlock your first ring
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">🏆 Next: Blue Ring at {nextRingXP.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ring Progression */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground text-center">Ring Progression</h3>
        <div className="flex items-center justify-center gap-4 overflow-x-auto py-2">
          {xpTiers.map((tier, index) => (
            <div key={tier.name} className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0">
              <div className={`
                w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs
                ${tier.locked 
                  ? 'border-muted bg-muted/20 text-muted-foreground' 
                  : `border-[${tier.color}] bg-gradient-to-br from-[${tier.color}]/20 to-[${tier.color}]/40`
                }
                transition-all duration-300
              `}>
                {tier.locked && <Lock className="w-4 h-4" />}
                {!tier.locked && <Trophy className="w-4 h-4" style={{ color: tier.color }} />}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-foreground">{tier.name}</div>
                <div className="text-xs text-muted-foreground">{tier.minXP.toLocaleString()} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Achievement */}
      {recentAchievement && (
        <div className="text-center space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Latest Achievement</h2>
          
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {getAchievementIcon(recentAchievement)}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-foreground">{recentAchievement.title}</h3>
              <div className="text-emerald-600 font-semibold">+{recentAchievement.xp} XP</div>
              <div className="text-sm text-muted-foreground">
                Unlocked {new Date(recentAchievement.dateEarned!).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {[
          { key: 'all', label: 'All', count: filterCounts.all },
          { key: 'unlocked', label: 'Unlocked', count: filterCounts.unlocked },
          { key: 'locked', label: 'Locked', count: filterCounts.locked },
          { key: 'exploration', label: 'Exploration', count: filterCounts.exploration },
          { key: 'skill', label: 'Skill', count: filterCounts.skill }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.key as any)}
            className="whitespace-nowrap text-xs"
          >
            {filter.label} ({filter.count})
          </Button>
        ))}
      </div>

      {/* Experience & Exploration Achievements Section */}
      {getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Experience & Exploration Achievements</h2>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement, index) => (
              <div
                key={index}
                className={`
                  relative p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer
                  ${achievement.isEarned 
                    ? 'bg-card border-border shadow-md hover:shadow-lg' 
                    : 'bg-muted/20 border-muted grayscale'
                  }
                `}
                onClick={() => {
                  setSelectedAchievement({
                    id: achievement.title,
                    name: achievement.title,
                    xp: achievement.xp,
                    unlocked: achievement.isEarned,
                    description: achievement.description,
                    progress: achievement.progress,
                    dateEarned: achievement.dateEarned,
                    unlockHint: achievement.unlockHint
                  });
                  setShowAchievementDetailModal(true);
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  {getAchievementIcon(achievement)}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {achievement.title}
                    </h3>
                    <div className="text-xs text-emerald-600 font-medium">
                      +{achievement.xp} XP
                    </div>
                  </div>
                </div>
                
                {!achievement.isEarned && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill & Performance Achievements Section */}
      {getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Skill & Performance Achievements</h2>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {getFilteredAchievements(skillAchievements, 'skill').map((achievement, index) => (
              <div
                key={index}
                className={`
                  relative p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer
                  ${achievement.isEarned 
                    ? 'bg-card border-border shadow-md hover:shadow-lg' 
                    : 'bg-muted/20 border-muted grayscale'
                  }
                `}
                onClick={() => {
                  setSelectedAchievement({
                    id: achievement.title,
                    name: achievement.title,
                    xp: achievement.xp,
                    unlocked: achievement.isEarned,
                    description: achievement.description,
                    progress: achievement.progress,
                    dateEarned: achievement.dateEarned,
                    unlockHint: achievement.unlockHint
                  });
                  setShowAchievementDetailModal(true);
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  {getAchievementIcon(achievement)}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {achievement.title}
                    </h3>
                    <div className="text-xs text-emerald-600 font-medium">
                      +{achievement.xp} XP
                    </div>
                  </div>
                </div>
                
                {!achievement.isEarned && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {showAchievementDetailModal && selectedAchievement && (
        <AchievementDetailModal
          isOpen={showAchievementDetailModal}
          onClose={() => setShowAchievementDetailModal(false)}
          achievement={selectedAchievement}
        />
      )}
    </div>
  );
};

export default AchievementsPane;