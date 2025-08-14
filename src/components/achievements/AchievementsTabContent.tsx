// AchievementsTabContent - Direct content from ClbhouzAchievementsModal
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface AchievementsTabContentProps {
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

const AchievementsTabContent: React.FC<AchievementsTabContentProps> = ({
  userId,
  userDisplayName = "User",
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  console.log('AchievementsTabContent rendering - v2.0');
  
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked' | 'exploration' | 'skill'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementModalData | null>(null);
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | 'idle'>('idle');
  const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const directionChangeTimer = useRef<NodeJS.Timeout | null>(null);
  
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

  // Exploration achievements data
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏌️",
      isEarned: true,
      description: "Play 20 different golf courses",
      xp: 100,
      isRepeatable: false,
      dateEarned: "2024-01-15",
      progress: "20/20"
    },
    {
      title: "50 Club",
      emoji: "🎯",
      isEarned: false,
      description: "Play 50 different golf courses",
      xp: 250,
      isRepeatable: false,
      progress: "40/50",
      unlockHint: "Visit 10 more unique courses to unlock this achievement"
    },
    {
      title: "100 Century Club",
      emoji: "🌟",
      isEarned: false,
      description: "Play 100 different golf courses",
      xp: 500,
      isRepeatable: false,
      progress: "40/100",
      unlockHint: "A true golf explorer - play courses across different regions"
    },
    {
      title: "200 Clubhouse Elite",
      emoji: "👑",
      isEarned: false,
      description: "Play 200 different golf courses",
      xp: 1000,
      isRepeatable: false,
      progress: "40/200"
    },
    {
      title: "300 Club Champion",
      emoji: "🏆",
      isEarned: false,
      description: "Play 300 different golf courses",
      xp: 2000,
      isRepeatable: false,
      progress: "40/300"
    }
  ];

  // Skill achievements data
  const skillAchievements: Achievement[] = [
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: false,
      description: "Record your first eagle",
      xp: 150,
      isRepeatable: false,
      unlockHint: "Score 2 under par on any hole"
    },
    {
      title: "Birdie Blitz",
      emoji: "🎯",
      isEarned: false,
      description: "Score 3+ birdies in one round",
      xp: 200,
      isRepeatable: false,
      progress: "2/3",
      unlockHint: "You're close! Just one more birdie in a single round"
    },
    {
      title: "Single-Figure Handicap",
      emoji: "🏌️",
      isEarned: false,
      description: "Achieve a handicap under 10",
      xp: 300,
      isRepeatable: false,
      progress: "Current: 12.3",
      unlockHint: "Keep improving your consistency to lower your handicap"
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
          switch (achievement.title) {
            case "50 Club":
              nudgeText = `${remaining} more course${remaining > 1 ? 's' : ''} to unlock!`;
              break;
            case "Birdie Blitz":
              nudgeText = `${remaining} more birdie${remaining > 1 ? 's' : ''} to collect!`;
              break;
            default:
              nudgeText = `${remaining} more to unlock!`;
          }
        }
        
        return { percentage, nudgeText };
      }
    }
    
    // Handle specific achievement types with different progress formats
    switch (achievement.title) {
      case "Single-Figure Handicap":
        const currentHandicap = 12.3; // Mock current handicap
        const targetHandicap = 9;
        const percentage = Math.max(0, ((20 - currentHandicap) / (20 - targetHandicap)) * 100);
        const remaining = (currentHandicap - targetHandicap).toFixed(1);
        return {
          percentage: Math.min(95, percentage),
          nudgeText: percentage >= 80 ? `${remaining} strokes off handicap to reach single figures!` : null
        };
      
      default:
        return { percentage: 0, nudgeText: null };
    }
  };

  // Get most recently unlocked achievement
  const getMostRecentAchievement = () => {
    const allAchievements = [...explorationAchievements, ...skillAchievements];
    const unlockedAchievements = allAchievements.filter(a => a.isEarned && a.dateEarned);
    
    if (unlockedAchievements.length === 0) return null;
    
    // Sort by date earned (most recent first)
    unlockedAchievements.sort((a, b) => {
      const dateA = new Date(a.dateEarned!);
      const dateB = new Date(b.dateEarned!);
      return dateB.getTime() - dateA.getTime();
    });
    
    return unlockedAchievements[0];
  };

  const mostRecentAchievement = getMostRecentAchievement();
  const filteredExplorationAchievements = getFilteredAchievements(explorationAchievements, 'exploration');
  const filteredSkillAchievements = getFilteredAchievements(skillAchievements, 'skill');

  return (
    <div className="min-h-screen bg-background">
      {/* XP Progress Header */}
      <div className={`sticky top-0 z-20 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-out border-b border-border ${
        isCollapsed ? 'py-2' : 'py-6'
      }`}>
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div className={`flex-1 transition-all duration-300 ease-out ${isCollapsed ? 'scale-90 opacity-70' : 'scale-100'}`}>
              {!isCollapsed && (
                <div className="flex flex-col items-center text-center mb-4">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {userDisplayName}'s Achievements
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Track your golf journey and unlock new milestones
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-4">
                <div className={`transition-all duration-300 ease-out ${isCollapsed ? 'scale-75' : 'scale-100'}`}>
                  <XPRingSystem 
                    currentXP={totalXP}
                  />
                </div>
                
                {!isCollapsed && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {totalXP.toLocaleString()} XP
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(nextMilestone - totalXP).toLocaleString()} to {nextTier?.name || 'Blue Ring'}
                    </div>
                    {currentTier && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Current: {currentTier.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setIsManuallyCollapsed(!isManuallyCollapsed);
              }}
              className="ml-4"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Most Recent Achievement Highlight */}
        {mostRecentAchievement && (
          <div className="px-4 py-6 border-b border-border">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Latest Achievement
              </h3>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">{mostRecentAchievement.emoji}</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-foreground mb-2">{mostRecentAchievement.title}</h4>
                    <p className="text-muted-foreground mb-2">{mostRecentAchievement.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        +{mostRecentAchievement.xp} XP
                      </span>
                      {mostRecentAchievement.dateEarned && (
                        <span className="text-muted-foreground">
                          Unlocked {new Date(mostRecentAchievement.dateEarned).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="px-4 py-4 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { id: 'all', label: 'All Achievements' },
                { id: 'unlocked', label: 'Unlocked' },
                { id: 'locked', label: 'Locked' },
                { id: 'exploration', label: 'Exploration' },
                { id: 'skill', label: 'Skill' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Experience & Exploration Section */}
            {(activeFilter === 'all' || activeFilter === 'exploration' || activeFilter === 'unlocked' || activeFilter === 'locked') && 
             filteredExplorationAchievements.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span>🏌️</span>
                  Experience & Exploration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExplorationAchievements.map((achievement, index) => {
                    const progress = getAchievementProgress(achievement);
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedAchievement({
                            id: achievement.title,
                            name: achievement.title,
                            xp: achievement.xp,
                            unlocked: achievement.isEarned,
                            description: achievement.description,
                            unlockHint: achievement.unlockHint,
                            progress: achievement.progress,
                            dateEarned: achievement.dateEarned,
                            isRepeatable: achievement.isRepeatable
                          });
                          setShowAchievementDetailModal(true);
                        }}
                        className={`bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                          !achievement.isEarned ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-4xl ${!achievement.isEarned ? 'grayscale' : ''}`}>
                            {achievement.emoji}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            
                            {achievement.isEarned ? (
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ Unlocked
                              </div>
                            ) : (
                              <>
                                {progress.percentage > 0 && (
                                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                                      style={{ width: `${progress.percentage}%` }}
                                    ></div>
                                  </div>
                                )}
                                {achievement.progress && (
                                  <div className="text-xs text-muted-foreground">{achievement.progress}</div>
                                )}
                                {progress.nudgeText && (
                                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    {progress.nudgeText}
                                  </div>
                                )}
                              </>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">+{achievement.xp} XP</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Skill & Performance Section */}
            {(activeFilter === 'all' || activeFilter === 'skill' || activeFilter === 'unlocked' || activeFilter === 'locked') && 
             filteredSkillAchievements.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span>⚡</span>
                  Skill & Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSkillAchievements.map((achievement, index) => {
                    const progress = getAchievementProgress(achievement);
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedAchievement({
                            id: achievement.title,
                            name: achievement.title,
                            xp: achievement.xp,
                            unlocked: achievement.isEarned,
                            description: achievement.description,
                            unlockHint: achievement.unlockHint,
                            progress: achievement.progress,
                            dateEarned: achievement.dateEarned,
                            isRepeatable: achievement.isRepeatable
                          });
                          setShowAchievementDetailModal(true);
                        }}
                        className={`bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                          !achievement.isEarned ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-4xl ${!achievement.isEarned ? 'grayscale' : ''}`}>
                            {achievement.emoji}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            
                            {achievement.isEarned ? (
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ Unlocked
                              </div>
                            ) : (
                              <>
                                {progress.percentage > 0 && (
                                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                                      style={{ width: `${progress.percentage}%` }}
                                    ></div>
                                  </div>
                                )}
                                {achievement.progress && (
                                  <div className="text-xs text-muted-foreground">{achievement.progress}</div>
                                )}
                                {achievement.unlockHint && (
                                  <div className="text-xs text-muted-foreground mt-1">{achievement.unlockHint}</div>
                                )}
                                {progress.nudgeText && (
                                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    {progress.nudgeText}
                                  </div>
                                )}
                              </>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">+{achievement.xp} XP</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* No Results Message */}
            {filteredExplorationAchievements.length === 0 && filteredSkillAchievements.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No achievements found</h3>
                <p className="text-muted-foreground">
                  {activeFilter === 'unlocked' 
                    ? "You haven't unlocked any achievements yet. Keep playing to earn your first badge!"
                    : `No ${activeFilter} achievements match your current filter.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          isOpen={showAchievementDetailModal}
          onClose={() => {
            setShowAchievementDetailModal(false);
            setSelectedAchievement(null);
          }}
          achievement={selectedAchievement}
        />
      )}
    </div>
  );
};

export default AchievementsTabContent;