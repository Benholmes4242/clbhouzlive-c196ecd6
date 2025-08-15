// AchievementsContent - Reusable achievements component for profile tab
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';

interface AchievementsContentProps {
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

const AchievementsContent: React.FC<AchievementsContentProps> = ({
  userId,
  userDisplayName = "User",
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser = true
}) => {
  console.log('AchievementsContent rendering');
  
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

  // Animation trigger when component loads
  useEffect(() => {
    const timer = setTimeout(() => setAnimateProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Handle manual toggle with override
  const handleToggleCollapse = () => {
    const newManualState = !isManuallyCollapsed;
    const newCollapseState = !isCollapsed;
    
    setIsManuallyCollapsed(newManualState);
    setIsCollapsed(newCollapseState);
    
    // If manually expanded, clear direction timer to prevent auto-collapse for a bit
    if (!newCollapseState && newManualState) {
      directionChangeTimer.current = setTimeout(() => {
        setIsManuallyCollapsed(false);
      }, 2000); // Allow 2 seconds of manual control before re-enabling auto
    }
  };

  // Reset state when component loads
  useEffect(() => {
    setIsManuallyCollapsed(false);
    setIsCollapsed(false);
    lastScrollTop.current = 0;
    scrollDirection.current = 'idle';
    
    // Clear timers
    if (scrollDebounceTimer.current) clearTimeout(scrollDebounceTimer.current);
    if (directionChangeTimer.current) clearTimeout(directionChangeTimer.current);
  }, []);

  // Trigger celebration on level up (mock for now)
  useEffect(() => {
    if (totalXP >= nextMilestone && !showCelebration) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [totalXP, nextMilestone, showCelebration]);

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
            case "Top 100 Conqueror":
              nudgeText = `${remaining} more Top 100 course${remaining > 1 ? 's' : ''} to unlock!`;
              break;
            case "Regional Master":
              nudgeText = `${remaining} more course${remaining > 1 ? 's' : ''} to complete the region!`;
              break;
            case "Eagle Collector":
              nudgeText = `${remaining} more eagle${remaining > 1 ? 's' : ''} to collect!`;
              break;
            case "Club Loyalist":
              nudgeText = `${remaining} more round${remaining > 1 ? 's' : ''} at your home club!`;
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
        const percentage = Math.max(0, (currentHandicap - targetHandicap) / currentHandicap * 100);
        const remaining = (currentHandicap - targetHandicap).toFixed(1);
        return {
          percentage: Math.min(95, percentage),
          nudgeText: percentage >= 80 ? `${remaining} strokes off handicap to reach single figures!` : null
        };
      
      case "Birdie Blitz":
        const currentBirdies = 2;
        const targetBirdies = 3;
        const birdiePercentage = (currentBirdies / targetBirdies) * 100;
        return {
          percentage: birdiePercentage,
          nudgeText: birdiePercentage >= 80 ? `1 more birdie in a round to unlock!` : null
        };
      
      case "No Bogey Round":
        const bestBogeys = 2;
        const targetBogeys = 0;
        const bogeyPercentage = Math.max(0, (4 - bestBogeys) / 4 * 100); // Assuming 4 is starting point
        return {
          percentage: bogeyPercentage,
          nudgeText: bogeyPercentage >= 80 ? `Avoid those last ${bestBogeys} bogey${bestBogeys > 1 ? 's' : ''} for a clean round!` : null
        };
      
      default:
        return { percentage: 0, nudgeText: null };
    }
  };

  // Mock achievements data - replace with real data
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

  return (
    <div className="w-full bg-background -mt-6 md:-mt-8 -mx-4 md:-mx-0">
      <div className={`${isMobile ? 'px-4 py-6' : 'px-8 py-8'} w-full`}>
        <div className="flex justify-between items-center">
          {/* Left side - Title and subtitle */}
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Achievements</h1>
            <h2 className="text-lg md:text-xl text-muted-foreground">Defining your game through achievement</h2>
          </div>
          
          {/* Right side - User profile */}
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
      
      <div className="w-full" style={{ paddingTop: isMobile ? '20px' : '30px', paddingBottom: isMobile ? '130px' : '60px' }}>
        {/* Collapsible XP Progress Header with Smooth Animations */}
        <div className={`sticky top-0 z-10 bg-card/95 backdrop-blur-sm transition-all duration-400 ease-in-out ${
          isCollapsed ? 'pt-2 pb-2' : isMobile ? 'pt-4 pb-4' : 'pt-6 pb-6'
        }`}>
          <div className={`${isMobile ? 'px-4' : 'px-8'} flex items-center justify-between`}>
            {/* Left side - XP Progress */}
            <div className="flex items-center space-x-4">
              <div className="text-left">
                <div className="text-sm text-muted-foreground font-medium">XP Progress</div>
                <div className="text-3xl font-bold text-foreground">
                  {totalXP.toLocaleString()} XP
                  <span className="text-lg text-muted-foreground ml-2">
                    of {nextMilestone.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCollapse}
              className="p-2 h-auto"
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>

          {/* XP Ring System and Featured Achievement - Collapsible */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0' : isMobile ? 'max-h-[600px] opacity-100' : 'max-h-[400px] opacity-100'
          }`}>
            <div className={`${isMobile ? 'px-4 mt-4' : 'px-8 mt-6'} flex flex-col lg:flex-row gap-6 lg:gap-12 items-center justify-center`}>
              {/* XP Ring System */}
              <div className="flex-shrink-0">
                <XPRingSystem 
                  currentXP={totalXP}
                  size={isMobile ? 'small' : 'medium'}
                />
              </div>

              {/* Most Recent Achievement - Featured Display */}
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
          </div>
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

export default AchievementsContent;