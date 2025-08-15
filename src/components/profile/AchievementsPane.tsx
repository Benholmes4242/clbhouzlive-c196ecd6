// AchievementsPane - Complete inline achievements for Profile page
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
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

  // Sample achievements data
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏆",
      isEarned: true,
      description: "Play 20 different courses. You're getting started on your golf journey!",
      xp: 200,
      isRepeatable: false,
      dateEarned: "August 8, 2025"
    },
    {
      title: "50 Club",
      emoji: "🏆",
      isEarned: false,
      description: "Play 50 different courses. Building your experience across diverse layouts!",
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
      description: "Get 3 birdies in a single round. Your putting is on fire!",
      xp: 75,
      isRepeatable: true,
      dateEarned: "August 8, 2025"
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Score 5 eagles in total. These rare birds are worth the hunt!",
      xp: 150,
      isRepeatable: false,
      progress: "2 / 5 eagles"
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

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="w-full flex flex-col bg-background">
        <div className={`${isMobile ? 'px-4 py-6' : 'px-8 py-8'} w-full`}>
          <div className="flex justify-center items-center">
            <div className="text-center">
              <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-black dark:text-white`}>
                Achievements
              </h1>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-black dark:text-white mt-1`}>
                Defining your game through achievement
              </p>
            </div>
          </div>
        </div>
        
        <div className="w-full" style={{ paddingTop: isMobile ? '20px' : '30px', paddingBottom: isMobile ? '130px' : '60px' }}>

          {/* Hero XP Progress Section - Desktop Only */}
          {!isMobile && (
            <div className="flex justify-center px-6 pb-8">
              <div className="flex items-center justify-center gap-12">
                <div className="relative flex-shrink-0">
                  <div className="relative w-80 h-80">
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
                      <div className="text-5xl font-bold text-foreground mb-3">
                        {totalXP.toLocaleString()} XP
                      </div>
                      <div className="text-base font-medium text-center leading-tight max-w-[200px]" style={{ color: nextTier.color }}>
                        {(nextTier.minXP - totalXP).toLocaleString()} XP remaining to unlock your {nextTier.name.split(' ')[0].toLowerCase()} ring
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3 mb-8">
                    <h3 className="font-semibold text-2xl text-black dark:text-white text-center">
                      {currentTier ? currentTier.name : 'No Ring Achieved'}
                    </h3>
                    <p className="text-base text-black dark:text-white text-center">
                      {currentTier ? 
                        `Congratulations! You've earned the ${currentTier.name}!` :
                        `Reach ${nextTier.minXP.toLocaleString()} XP to unlock your first ring`
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-medium text-blue-600">XP earned this month</span>
                    <div className="flex items-center gap-1 text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold">450 XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Ring Progression Section - Same width as badges */}
          {!isMobile && (
            <div className="px-0 pb-8">
              <div className="p-6">
                <h4 className="text-sm font-medium text-black dark:text-white mb-3 text-center">Ring Progression</h4>
                <div className="relative flex justify-between items-center gap-2">
                  {/* Connector lines - segments between rings with gaps */}
                  <div className="absolute top-8 left-0 right-0 h-px z-0">
                    {/* Line segment 1: between ring 1 and 2 */}
                    <div className="absolute h-px bg-gray-300 dark:bg-gray-600" style={{ left: '16%', right: '59%' }} />
                    {/* Line segment 2: between ring 2 and 3 */}
                    <div className="absolute h-px bg-gray-300 dark:bg-gray-600" style={{ left: '41%', right: '34%' }} />
                    {/* Line segment 3: between ring 3 and 4 */}
                    <div className="absolute h-px bg-gray-300 dark:bg-gray-600" style={{ left: '66%', right: '9%' }} />
                  </div>
                  
                  {xpTiers.map((tier, index) => {
                    const isActive = totalXP >= tier.minXP;
                    const isCurrent = currentTier?.name === tier.name;
                    const isNext = nextTier?.name === tier.name;
                    
                    // Calculate progress for this specific tier
                    let tierProgress = 0;
                    if (isActive) {
                      tierProgress = 100;
                    } else if (isCurrent || isNext) {
                      const tierStart = index === 0 ? 0 : xpTiers[index - 1].minXP;
                      const tierEnd = tier.minXP;
                      const tierRange = tierEnd - tierStart;
                      const currentProgress = Math.max(0, totalXP - tierStart);
                      tierProgress = Math.min(100, (currentProgress / tierRange) * 100);
                    }
                    
                    return (
                      <div key={tier.name} className="flex-1 text-center relative z-10">
                        <div className="relative flex justify-center mb-2">
                          {/* Progress ring */}
                          <svg className={`w-16 h-16 transform -rotate-90 ${isNext && !isActive ? 'animate-pulse' : ''}`} viewBox="0 0 64 64">
                            {/* Background ring */}
                            <circle
                              cx="32"
                              cy="32"
                              r="30"
                              fill="none"
                              stroke={`${tier.color}30`}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            
                            {/* Progress circle */}
                            {tierProgress > 0 && (
                              <circle
                                cx="32"
                                cy="32"
                                r="30"
                                stroke={tier.color}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${30 * 2 * Math.PI}`}
                                strokeDashoffset={`${30 * 2 * Math.PI * (1 - tierProgress / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                              />
                            )}
                          </svg>
                          
                          {/* Padlock icon for locked rings */}
                          {!isActive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <img 
                                src="/lovable-uploads/b9837878-ceb4-4653-b157-cfe4045aac1d.png" 
                                alt="Locked" 
                                className="w-6 h-6 opacity-60"
                              />
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium mb-1 text-black dark:text-white">
                          {tier.name}
                        </div>
                        <div className="text-xs text-black dark:text-white">
                          {tier.minXP.toLocaleString()} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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

          {/* Mobile XP Progress - Simplified */}
          {isMobile && (
            <div className="px-4 pb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">
                  {totalXP.toLocaleString()} XP
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}% to {nextTier.name}
                </div>
              </div>
            </div>
          )}

          {/* Experience & Exploration Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
            <div className={`${isMobile ? 'px-0 pb-6' : 'px-6 pb-8'}`}>
              <div className="p-6">
                <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                  <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                    Experience & Exploration Achievements
                  </h3>
                </div>
                
                <div className={`${isMobile ? 'grid grid-cols-3 gap-2 px-0' : 'grid grid-cols-4 gap-3'}`}>
                  {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement) => (
                    <div key={achievement.title} className="relative">
                      <div
                        className={`
                          transition-all duration-200 hover:scale-105 cursor-pointer 
                          ${isMobile ? 'p-1 flex flex-col items-center text-center space-y-1' : 'p-4 flex flex-col items-center text-center space-y-3'}
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
                            isRepeatable: achievement.isRepeatable
                          });
                          setShowAchievementDetailModal(true);
                        }}
                      >
                        <div className="flex justify-center items-center">
                          <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                            <div className={isMobile ? "w-24 h-24 text-6xl" : "w-40 h-40 text-8xl"}>
                              {achievement.emoji}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
                            {achievement.title.toUpperCase()}
                          </h4>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${achievement.isEarned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            +{achievement.xp} XP
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Skill & Performance Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'skill') && getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
            <div className={`${isMobile ? 'px-0 pb-6' : 'px-6 pb-8'}`}>
              <div className="p-6">
                <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                  <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                    Skill & Performance Achievements
                  </h3>
                </div>
                
                <div className={`${isMobile ? 'grid grid-cols-3 gap-2 px-0' : 'grid grid-cols-4 gap-3'}`}>
                  {getFilteredAchievements(skillAchievements, 'skill').map((achievement) => (
                    <div key={achievement.title} className="relative">
                      <div
                        className={`
                          transition-all duration-200 hover:scale-105 cursor-pointer 
                          ${isMobile ? 'p-1 flex flex-col items-center text-center space-y-1' : 'p-4 flex flex-col items-center text-center space-y-3'}
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
                            isRepeatable: achievement.isRepeatable
                          });
                          setShowAchievementDetailModal(true);
                        }}
                      >
                        <div className="flex justify-center items-center">
                          <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                            <div className={isMobile ? "w-24 h-24 text-6xl" : "w-40 h-40 text-8xl"}>
                              {achievement.emoji}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                            {achievement.title.toUpperCase()}
                          </h4>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${achievement.isEarned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            +{achievement.xp} XP
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        isOpen={showAchievementDetailModal}
        onClose={() => setShowAchievementDetailModal(false)}
        achievement={selectedAchievement}
      />
    </div>
  );
};

export default AchievementsPane;