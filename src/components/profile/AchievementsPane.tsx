// AchievementsPane - Inline achievements for Profile page
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
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

  // Handle manual toggle
  const handleToggleCollapse = () => {
    const newManualState = !isManuallyCollapsed;
    const newCollapseState = !isCollapsed;
    
    setIsManuallyCollapsed(newManualState);
    setIsCollapsed(newCollapseState);
    
    if (!newCollapseState && newManualState) {
      directionChangeTimer.current = setTimeout(() => {
        setIsManuallyCollapsed(false);
      }, 2000);
    }
  };

  // Reset state when component mounts
  useEffect(() => {
    setIsManuallyCollapsed(false);
    setIsCollapsed(false);
    lastScrollTop.current = 0;
    scrollDirection.current = 'idle';
    
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

  // Mock achievements data (same as original)
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏌️",
      isEarned: true,
      description: "Play 20 different golf courses",
      xp: 1000,
      isRepeatable: false,
      dateEarned: "2024-01-15",
    },
    {
      title: "50 Club",
      emoji: "⛳",
      isEarned: true,
      description: "Play 50 different golf courses",
      xp: 2500,
      isRepeatable: false,
      dateEarned: "2024-03-08",
    },
    {
      title: "100 Club",
      emoji: "🌍",
      isEarned: false,
      description: "Play 100 different golf courses",
      xp: 5000,
      isRepeatable: false,
      unlockHint: "Keep exploring new courses!",
    },
    {
      title: "Globetrotter",
      emoji: "✈️",
      isEarned: false,
      description: "Play a golf course in 5 different countries",
      xp: 7500,
      isRepeatable: false,
      unlockHint: "Time to pack your bags!",
    },
    {
      title: "Local Hero",
      emoji: "📍",
      isEarned: false,
      description: "Play all golf courses in your state",
      xp: 3000,
      isRepeatable: false,
      unlockHint: "Explore your backyard!",
    },
  ];

  const skillAchievements: Achievement[] = [
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: true,
      description: "Score your first eagle",
      xp: 500,
      isRepeatable: false,
      dateEarned: "2023-12-20",
    },
    {
      title: "Birdie Machine",
      emoji: "🐦",
      isEarned: true,
      description: "Score 10 birdies in a single round",
      xp: 1500,
      isRepeatable: true,
      dateEarned: "2024-02-01",
    },
    {
      title: "Par Master",
      emoji: "✅",
      isEarned: false,
      description: "Achieve par or better on all holes in a round",
      xp: 3000,
      isRepeatable: false,
      unlockHint: "Consistency is key!",
    },
    {
      title: "Ace!",
      emoji: "🎯",
      isEarned: false,
      description: "Score a hole-in-one",
      xp: 10000,
      isRepeatable: false,
      unlockHint: "Aim for the bullseye!",
    },
    {
      title: "Sand Savior",
      emoji: "🏖️",
      isEarned: false,
      description: "Successfully escape a bunker in one shot 5 times",
      xp: 2000,
      isRepeatable: true,
      unlockHint: "Get good at bunker shots!",
    },
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* XP Ring System */}
      <div className={`transition-all duration-700 ease-out ${isCollapsed ? (isMobile ? 'h-10 md:h-12' : 'h-12') : (isMobile ? 'h-80 md:h-96' : 'h-96')} overflow-hidden`}>
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">XP Progress</h2>
        <p className="text-lg">{totalXP} XP / {nextMilestone} XP</p>
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-700" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleCollapse}
          className="mt-4"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
      </div>

      {/* Achievements Content */}
      <div className="px-4 md:px-0">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {[
            { key: 'all', label: 'All' },
            { key: 'unlocked', label: 'Unlocked' },
            { key: 'locked', label: 'Locked' },
            { key: 'exploration', label: 'Exploration' },
            { key: 'skill', label: 'Skill' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={activeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(key as any)}
              className="rounded-full"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Achievements Sections */}
        <div className="space-y-8">
          {/* Exploration Achievements */}
          {(activeFilter === 'all' || activeFilter === 'exploration') && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Exploration Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement, index) => (
                  <div
                    key={achievement.title}
                    className={`bg-card rounded-lg p-4 border transition-all duration-300 hover:shadow-lg ${
                      achievement.isEarned 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'border-muted-foreground/20 bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{achievement.emoji}</div>
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.xp} XP</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    {achievement.isEarned && achievement.dateEarned && (
                      <p className="text-xs text-primary">Earned on {new Date(achievement.dateEarned).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Achievements */}
          {(activeFilter === 'all' || activeFilter === 'skill') && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Skill Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredAchievements(skillAchievements, 'skill').map((achievement, index) => (
                  <div
                    key={achievement.title}
                    className={`bg-card rounded-lg p-4 border transition-all duration-300 hover:shadow-lg ${
                      achievement.isEarned 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'border-muted-foreground/20 bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{achievement.emoji}</div>
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.xp} XP</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    {achievement.isEarned && achievement.dateEarned && (
                      <p className="text-xs text-primary">Earned on {new Date(achievement.dateEarned).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
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
