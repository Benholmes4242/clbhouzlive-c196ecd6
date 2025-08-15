// ClbhouzAchievementsModal - Achievement Modal
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface ClbhouzAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ClbhouzAchievementsModal: React.FC<ClbhouzAchievementsModalProps> = ({
  isOpen,
  onClose,
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
  
  // Mock XP data
  const totalXP = 2500;
  const nextMilestone = 10000;
  
  // XP Tier System
  const xpTiers = [
    { name: "Blue Ring", color: "#3B82F6", minXP: 10000 },
    { name: "Green Ring", color: "#10B981", minXP: 20000 },
    { name: "Silver Ring", color: "#6B7280", minXP: 30000 },
    { name: "Gold Ring", color: "#F59E0B", minXP: 40000 }
  ];
  
  const currentTier = xpTiers.slice().reverse().find(tier => totalXP >= tier.minXP);
  const nextTier = xpTiers.find(tier => totalXP < tier.minXP) || xpTiers[xpTiers.length - 1];

  // Sample achievements data
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏆",
      isEarned: true,
      description: "Play 20 different courses",
      xp: 200,
      isRepeatable: false,
      dateEarned: "August 8, 2025"
    },
    {
      title: "50 Club",
      emoji: "🏆",
      isEarned: false,
      description: "Play 50 different courses",
      xp: 350,
      isRepeatable: false,
      progress: "23 / 50 courses"
    }
  ];

  const skillAchievements: Achievement[] = [
    {
      title: "Birdie Blitz",
      emoji: "🐦",
      isEarned: true,
      description: "Get 3 birdies in a single round",
      xp: 75,
      isRepeatable: true,
      dateEarned: "August 8, 2025"
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Score 5 eagles in total",
      xp: 150,
      isRepeatable: false,
      progress: "2 / 5 eagles"
    }
  ];

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile ? 'max-w-[95vw] max-h-[90vh] p-0' : 'max-w-2xl max-h-[85vh] p-0'} 
        overflow-hidden flex flex-col bg-white
      `}>
        <DialogHeader className={`${isMobile ? 'p-4 pb-2' : 'p-6 pb-4'} flex-shrink-0`}>
          <div className="flex justify-between items-center">
            <div className="text-left">
              <DialogTitle className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-black dark:text-white`}>
                Achievements
              </DialogTitle>
              <DialogDescription className={`${isMobile ? 'text-sm' : 'text-base'} text-black dark:text-white mt-1`}>
                Defining your game through achievement
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>
                {userProfilePhotoUrl ? (
                  <img 
                    src={userProfilePhotoUrl} 
                    alt={userDisplayName} 
                    className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-full object-cover`}
                  />
                ) : (
                  userDisplayName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* XP Progress Section */}
          <div className="flex justify-center px-6 pb-8">
            <div className="flex items-center justify-center gap-12">
              <div className="relative flex-shrink-0">
                <div className="relative w-60 h-60">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {totalXP.toLocaleString()} XP
                    </div>
                    <div className="text-sm font-medium text-center leading-tight max-w-[150px]" style={{ color: nextTier.color }}>
                      {(nextTier.minXP - totalXP).toLocaleString()} XP remaining to unlock your {nextTier.name.split(' ')[0].toLowerCase()} ring
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-xl text-black dark:text-white text-center">
                    {currentTier ? currentTier.name : 'No Ring Achieved'}
                  </h3>
                  <p className="text-sm text-black dark:text-white text-center">
                    {currentTier ? 
                      `Congratulations! You've earned the ${currentTier.name}!` :
                      `Reach ${nextTier.minXP.toLocaleString()} XP to unlock your first ring`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ring Progression Section */}
          <div className="px-0 pb-8">
            <div className="p-6">
              <h4 className="text-sm font-medium text-black dark:text-white mb-3 text-center">Ring Progression</h4>
              <div className="relative flex justify-between items-center gap-2">
                {/* Connector lines */}
                <div className="absolute top-8 left-0 right-0 h-px z-0">
                  <div className="absolute h-px bg-gray-300 dark:bg-gray-600" style={{ left: '16%', right: '59%' }} />
                  <div className="absolute h-px bg-gray-300 dark:bg-gray-600" style={{ left: '41%', right: '34%' }} />
                  <div className="absolute h-px bg-gray-300 dark:bg-gray-600" style={{ left: '66%', right: '9%' }} />
                </div>
                
                {xpTiers.map((tier, index) => {
                  const isActive = totalXP >= tier.minXP;
                  const isNext = nextTier?.name === tier.name;
                  
                  let tierProgress = 0;
                  if (isActive) {
                    tierProgress = 100;
                  } else if (isNext) {
                    const tierStart = index === 0 ? 0 : xpTiers[index - 1].minXP;
                    const tierEnd = tier.minXP;
                    const tierRange = tierEnd - tierStart;
                    const currentProgress = Math.max(0, totalXP - tierStart);
                    tierProgress = Math.min(100, (currentProgress / tierRange) * 100);
                  }
                  
                  return (
                    <div key={tier.name} className="flex-1 text-center relative z-10">
                      <div className="relative flex justify-center mb-2">
                        <svg className={`w-16 h-16 transform -rotate-90 ${isNext && !isActive ? 'animate-pulse' : ''}`} viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="30" fill="none" stroke={`${tier.color}30`} strokeWidth="3" strokeLinecap="round" />
                          {tierProgress > 0 && (
                            <circle cx="32" cy="32" r="30" stroke={tier.color} strokeWidth="3" fill="none"
                              strokeDasharray={`${30 * 2 * Math.PI}`}
                              strokeDashoffset={`${30 * 2 * Math.PI * (1 - tierProgress / 100)}`}
                              strokeLinecap="round" className="transition-all duration-700" />
                          )}
                        </svg>
                        {!isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img src="/lovable-uploads/b9837878-ceb4-4653-b157-cfe4045aac1d.png" alt="Locked" className="w-6 h-6 opacity-60" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium mb-1 text-black dark:text-white">{tier.name}</div>
                      <div className="text-xs text-black dark:text-white">{tier.minXP.toLocaleString()} XP</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-0 pb-6">
            <div className="p-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {(() => {
                  const allAchievements = [...explorationAchievements, ...skillAchievements];
                  const unlockedCount = allAchievements.filter(a => a.isEarned).length;
                  const lockedCount = allAchievements.filter(a => !a.isEarned).length;
                  const explorationCount = explorationAchievements.length;
                  const skillCount = skillAchievements.length;
                  
                  const filters = [
                    { id: 'all', label: 'All', count: allAchievements.length },
                    { id: 'unlocked', label: 'Unlocked', count: unlockedCount },
                    { id: 'locked', label: 'Locked', count: lockedCount },
                    { id: 'exploration', label: 'Exploration', count: explorationCount },
                    { id: 'skill', label: 'Skill', count: skillCount }
                  ];
                  
                  return filters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={activeFilter === filter.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                      className={`
                        rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
                        ${activeFilter === filter.id 
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700' 
                          : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      {filter.label} ({filter.count})
                    </Button>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-4">
              {[...getFilteredAchievements(explorationAchievements, 'exploration'), ...getFilteredAchievements(skillAchievements, 'skill')].map((achievement) => (
                <div key={achievement.title} className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-4xl mb-2">{achievement.emoji}</div>
                  <h4 className="text-sm font-medium mb-1">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">+{achievement.xp} XP</p>
                  {achievement.isEarned && (
                    <div className="text-xs text-green-600 mt-1">Unlocked</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>

      <AchievementDetailModal
        isOpen={showAchievementDetailModal}
        onClose={() => setShowAchievementDetailModal(false)}
        achievement={selectedAchievement}
      />
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;