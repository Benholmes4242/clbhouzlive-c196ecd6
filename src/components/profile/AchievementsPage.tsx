import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

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

interface AchievementsPageProps {
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
}

const AchievementsPage: React.FC<AchievementsPageProps> = ({
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
  const [animateProgress, setAnimateProgress] = useState(false);

  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  const nextMilestone = 10000;
  const progressPercentage = isMobile ? 100 : (totalXP / nextMilestone) * 100;
  
  // XP Tier System
  const xpTiers = [
    { name: "Blue Ring", color: "#3B82F6", minXP: 10000 },
    { name: "Green Ring", color: "#10B981", minXP: 20000 },
    { name: "Silver Ring", color: "#6B7280", minXP: 30000 },
    { name: "Gold Ring", color: "#F59E0B", minXP: 40000 }
  ];
  
  const currentTier = xpTiers.slice().reverse().find(tier => totalXP >= tier.minXP);
  const nextTier = xpTiers.find(tier => totalXP < tier.minXP) || xpTiers[xpTiers.length - 1];

  // Animation trigger when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

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

  // Helper function to calculate progress percentage and get smart nudges
  const getAchievementProgress = (achievement: Achievement) => {
    if (achievement.isEarned) return { percentage: 100, nudgeText: null };
    
    // Parse progress strings to calculate percentages
    if (achievement.progress?.includes('/')) {
      const [current, total] = achievement.progress.split('/').map(s => parseInt(s.trim()));
      if (!isNaN(current) && !isNaN(total) && total > 0) {
        const percentage = (current / total) * 100;
        const remaining = total - current;
        
        // Generate nudge text based on achievement type
        let nudgeText = null;
        if (percentage >= 80 && percentage < 100) {
          nudgeText = `${remaining} more to unlock!`;
        }
        
        return { percentage, nudgeText };
      }
    }
    
    return { percentage: 0, nudgeText: null };
  };

  // Helper function to get achievement badge image
  const getAchievementIcon = (achievement: Achievement) => {
    // Use custom badges for specific achievements regardless of earned status
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Eagle Collector":
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      default:
        return (
          <div className={`
            text-4xl transition-all duration-200 
            ${achievement.isEarned 
              ? 'grayscale-0 opacity-100 drop-shadow-lg' 
              : 'grayscale opacity-60'
            }
          `}>
            {achievement.emoji}
          </div>
        );
    }
  };

  // Exploration & Travel Achievements
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏌️",
      isEarned: true,
      description: "Play your first 20 golf courses. Welcome to the clubhouse!",
      xp: 200,
      isRepeatable: false,
      progress: "20 / 20 courses",
      dateEarned: "January 15, 2024"
    },
    {
      title: "50 Club",
      emoji: "⭐",
      isEarned: true,
      description: "Reach the milestone of 50 courses played. You're getting serious!",
      xp: 300,
      isRepeatable: false,
      progress: "50 / 50 courses",
      dateEarned: "November 8, 2023"
    },
    {
      title: "100 Century Club",
      emoji: "💯",
      isEarned: false,
      description: "Join the exclusive 100 courses club. True dedication to the game!",
      xp: 500,
      isRepeatable: false,
      progress: "78 / 100 courses",
      unlockHint: "Keep exploring new courses to unlock this achievement!"
    }
  ];

  // Skill-Based Achievements
  const skillBasedAchievements: Achievement[] = [
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: true,
      description: "Score 5 eagles in ranked rounds. Master of precision!",
      xp: 400,
      isRepeatable: false,
      progress: "5 / 5 eagles",
      dateEarned: "March 10, 2024"
    },
    {
      title: "Birdie Blitz",
      emoji: "🎯",
      isEarned: false,
      description: "Score 3 birdies in a single round. Show your scoring prowess!",
      xp: 150,
      isRepeatable: true,
      progress: "2 / 3 birdies",
      unlockHint: "One more birdie in a round to unlock!"
    },
    {
      title: "No Bogey Round",
      emoji: "⚡",
      isEarned: false,
      description: "Complete a full round without a single bogey. Consistency is key!",
      xp: 300,
      isRepeatable: true,
      unlockHint: "Avoid those last bogeys for a clean round!"
    }
  ];

  const handleAchievementClick = (achievement: Achievement) => {
    const modalData: AchievementModalData = {
      id: achievement.title,
      name: achievement.title,
      description: achievement.description,
      xp: achievement.xp,
      unlocked: achievement.isEarned,
      progress: achievement.progress,
      dateEarned: achievement.dateEarned,
      unlockHint: achievement.unlockHint,
      isRepeatable: achievement.isRepeatable
    };
    setSelectedAchievement(modalData);
    setShowAchievementDetailModal(true);
  };

  const renderAchievementSection = (title: string, achievements: Achievement[], category: string) => {
    const filteredAchievements = getFilteredAchievements(achievements, category);
    
    if (filteredAchievements.length === 0 && activeFilter !== 'all') {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {title}
        </h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'}`}>
          {filteredAchievements.map((achievement, index) => {
            const { percentage, nudgeText } = getAchievementProgress(achievement);
            
            return (
              <div
                key={index}
                onClick={() => handleAchievementClick(achievement)}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105
                  ${achievement.isEarned 
                    ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md' 
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                  }
                `}
              >
                {/* Achievement Badge */}
                <div className="flex flex-col items-center mb-3">
                  <div className={`mb-2 ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center`}>
                    {getAchievementIcon(achievement)}
                  </div>
                  
                  {/* Achievement Title */}
                  <h4 className={`font-semibold text-center leading-tight ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {achievement.title}
                  </h4>
                </div>

                {/* XP Badge */}
                {achievement.isEarned && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      +{achievement.xp} XP
                    </div>
                  </div>
                )}

                {/* Progress Bar for Locked Achievements */}
                {!achievement.isEarned && achievement.progress && (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2 mb-1">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {achievement.progress}
                    </div>
                  </div>
                )}

                {/* Nudge Text */}
                {nudgeText && (
                  <div className="mt-2 text-xs text-primary text-center font-medium">
                    {nudgeText}
                  </div>
                )}

                {/* Earned Date */}
                {achievement.isEarned && achievement.dateEarned && (
                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Earned {achievement.dateEarned}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header with Profile Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Achievements</h1>
          <p className="text-muted-foreground mb-6">Defining your game through achievement</p>
          
          {/* User Profile Section */}
          <div className="flex items-center gap-4 mb-6">
            {userProfilePhotoUrl && (
              <img 
                src={userProfilePhotoUrl} 
                alt={userDisplayName} 
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div className="text-left">
              <h2 className="text-lg font-semibold text-foreground">{userDisplayName}</h2>
              {userHandicap && (
                <p className="text-muted-foreground">Handicap: {userHandicap}</p>
              )}
            </div>
          </div>
        </div>

        {/* XP Progress Section */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">XP Progress</h3>
              <p className="text-muted-foreground">Keep playing to unlock new rings!</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-foreground">{totalXP.toLocaleString()} XP</span>
              </div>
              <p className="text-sm text-muted-foreground">Current Progress</p>
            </div>
          </div>

          {/* XP Ring System */}
          <XPRingSystem 
            currentXP={totalXP}
            size="large"
          />

          {/* Ring Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-foreground">Progress to {nextTier.name}</span>
              <span className="text-sm font-medium text-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 rounded-full h-2 transition-all duration-1000 ease-out"
                style={{ 
                  width: animateProgress ? `${Math.min(progressPercentage, 100)}%` : '0%'
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP</span>
            </div>
          </div>

          {/* Ring Progression */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-foreground mb-3">Ring Progression</h4>
            <div className="grid grid-cols-4 gap-4">
              {xpTiers.map((tier, index) => (
                <div key={index} className="text-center">
                  <div 
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mx-auto mb-2 transition-all ${
                      totalXP >= tier.minXP 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted bg-muted'
                    }`}
                    style={{
                      borderColor: totalXP >= tier.minXP ? tier.color : undefined
                    }}
                  >
                    <Trophy 
                      className={`h-6 w-6 ${
                        totalXP >= tier.minXP ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      style={{
                        color: totalXP >= tier.minXP ? tier.color : undefined
                      }}
                    />
                  </div>
                  <div className="text-xs font-medium text-foreground">{tier.name}</div>
                  <div className="text-xs text-muted-foreground">{tier.minXP.toLocaleString()} XP</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All Achievements' },
            { key: 'unlocked', label: 'Unlocked Only' },
            { key: 'locked', label: 'Locked Only' },
            { key: 'exploration', label: 'Experience & Exploration' },
            { key: 'skill', label: 'Skill-Based' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={activeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(key as any)}
              className="text-xs"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Achievement Sections */}
        {(activeFilter === 'all' || activeFilter === 'exploration') && (
          renderAchievementSection("Experience & Exploration Achievements", explorationAchievements, 'exploration')
        )}
        
        {(activeFilter === 'all' || activeFilter === 'skill') && (
          renderAchievementSection("Skill-Based Achievements", skillBasedAchievements, 'skill')
        )}

        {/* Achievement Detail Modal */}
        {selectedAchievement && (
          <AchievementDetailModal
            isOpen={showAchievementDetailModal}
            onClose={() => setShowAchievementDetailModal(false)}
            achievement={selectedAchievement}
          />
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;