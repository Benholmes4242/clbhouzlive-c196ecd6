// AchievementsTabContent - Full page achievements view
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
  console.log('AchievementsTabContent rendering - v1.0');
  
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

  // Smart scroll detection with direction threshold and debouncing
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const currentScrollTop = scrollElement.scrollTop;
      const scrollDelta = currentScrollTop - lastScrollTop.current;
      const absScrollDelta = Math.abs(scrollDelta);
      
      // Process any scroll movement for immediate feedback
      if (absScrollDelta < 1) {
        return;
      }
      
      // Determine scroll direction
      const newDirection = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'idle';
      
      // Clear existing timers
      if (scrollDebounceTimer.current) {
        clearTimeout(scrollDebounceTimer.current);
      }
      
      // Immediate collapse/expand for mobile with less debounce
      if (isMobile) {
        // Immediate response for mobile
        if (!isManuallyCollapsed) {
          if (newDirection === 'down' && currentScrollTop > 10) {
            setIsCollapsed(true);
          } else if (newDirection === 'up' && currentScrollTop < 50) {
            setIsCollapsed(false);
          }
        }
      } else {
        // Desktop behavior - immediate collapse on any scroll down
        if (!isManuallyCollapsed) {
          if (newDirection === 'down' && currentScrollTop > 5) { // Immediate collapse threshold
            setIsCollapsed(true);
          } else if (newDirection === 'up' && currentScrollTop < 20) { // Lower threshold for expand
            setIsCollapsed(false);
          }
        }
      }
      
      lastScrollTop.current = currentScrollTop;
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [isManuallyCollapsed, isMobile]);

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

  // Helper function to get achievement badge image for featured display
  const getFeaturedAchievementIcon = (achievement: Achievement) => {
    // Use custom badges for specific achievements
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className="w-48 h-48" />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className="w-48 h-48" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className="w-48 h-48" />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/88ba82c3-999c-40b9-885e-313869a7e795.png" alt="200 Clubhouse Elite Badge" className="w-48 h-48" />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/0088ccbe-6198-4f2c-ada2-e2bf642abec3.png" alt="300 Club Champion Badge" className="w-48 h-48" />;
      case "Eagle Collector":
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className="w-48 h-48" />;
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className="w-48 h-48" />;
      case "Birdie Every Par":
        return <img src="/lovable-uploads/164a0671-f0ff-4f1e-8780-4bba8a8fe7f4.png" alt="Birdie Every Par Badge" className="w-48 h-48" />;
      case "One Day, Two Courses":
        return <img src="/lovable-uploads/f8900d31-7d35-4e4e-9352-99f6198da121.png" alt="One Day Two Courses Badge" className="w-48 h-48" />;
      case "Globetrotter Golfer":
        return <img src="/lovable-uploads/684002ed-a5a9-46e9-a1fc-384da5a7c686.png" alt="Globetrotter Golfer Badge" className="w-48 h-48" />;
      case "Marathon Golfer":
        return <img src="/lovable-uploads/02a84f2b-af4f-4064-a7d6-bdd88575b69e.png" alt="Marathon Golfer Badge" className="w-48 h-48" />;
      case "Single-Figure Handicap":
        return <img src="/lovable-uploads/066c5dd6-9e79-49f2-8e4b-935a5242850a.png" alt="Single-Figure Handicap Badge" className="w-48 h-48" />;
      case "Plus Handicap Player":
        return <img src="/lovable-uploads/1779738a-184b-4a0d-85d0-b964641019d9.png" alt="Plus Handicap Player Badge" className="w-48 h-48" />;
      case "Under Par Round":
        return <img src="/lovable-uploads/d7d44dea-f5cc-416d-9a01-985d48262fc6.png" alt="Under Par Round Badge" className="w-48 h-48" />;
      case "First Eagle":
        return <img src="/lovable-uploads/6b62e9b3-33d7-4825-b1d7-aac6f86e4ad7.png" alt="First Eagle Badge" className="w-48 h-48" />;
      case "Hole-in-One":
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className="w-48 h-48" />;
      case "Back-to-Back Birdies":
        return <img src="/lovable-uploads/7e98fdc5-ab55-44e0-87ec-8b93e493b7e4.png" alt="Back-to-Back Birdies Badge" className="w-48 h-48" />;
      case "No Bogey Round":
        return <img src="/lovable-uploads/1a37c1e5-56c0-4e02-a95a-cbfa8ce3a1b6.png" alt="No Bogey Round Badge" className="w-48 h-48" />;
      case "Par Machine":
        return <img src="/lovable-uploads/51973f3e-599d-4110-bcf6-8eac43b963f8.png" alt="Par Machine Badge" className="w-48 h-48" />;
      case "International Golfer":
        return <img src="/lovable-uploads/3c0146da-b965-42cc-b130-ef9c25727aad.png" alt="International Golfer Badge" className="w-48 h-48" />;
      // Regional achievement badges
      case "Lynx Legend":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className="w-48 h-48 rounded-lg" />;
      case "The Continental Swinger":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Swinger Badge" className="w-48 h-48 rounded-lg" />;
      case "Stars and Stripes Tourer":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className="w-48 h-48 rounded-lg" />;
      case "Legends Club":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Legends Club Badge" className="w-48 h-48 rounded-lg" />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className="w-48 h-48" />;
      default:
        return (
          <div className="w-48 h-48 text-8xl flex items-center justify-center drop-shadow-lg">
            {achievement.emoji}
          </div>
        );
    }
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
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/88ba82c3-999c-40b9-885e-313869a7e795.png" alt="200 Clubhouse Elite Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/0088ccbe-6198-4f2c-ada2-e2bf642abec3.png" alt="300 Club Champion Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Eagle Collector":
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Birdie Every Par":
        return <img src="/lovable-uploads/164a0671-f0ff-4f1e-8780-4bba8a8fe7f4.png" alt="Birdie Every Par Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "One Day, Two Courses":
        return <img src="/lovable-uploads/f8900d31-7d35-4e4e-9352-99f6198da121.png" alt="One Day Two Courses Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Globetrotter Golfer":
        return <img src="/lovable-uploads/684002ed-a5a9-46e9-a1fc-384da5a7c686.png" alt="Globetrotter Golfer Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Marathon Golfer":
        return <img src="/lovable-uploads/02a84f2b-af4f-4064-a7d6-bdd88575b69e.png" alt="Marathon Golfer Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Single-Figure Handicap":
        return <img src="/lovable-uploads/066c5dd6-9e79-49f2-8e4b-935a5242850a.png" alt="Single-Figure Handicap Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Plus Handicap Player":
        return <img src="/lovable-uploads/1779738a-184b-4a0d-85d0-b964641019d9.png" alt="Plus Handicap Player Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Under Par Round":
        return <img src="/lovable-uploads/d7d44dea-f5cc-416d-9a01-985d48262fc6.png" alt="Under Par Round Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "First Eagle":
        return <img src="/lovable-uploads/6b62e9b3-33d7-4825-b1d7-aac6f86e4ad7.png" alt="First Eagle Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Hole-in-One":
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Back-to-Back Birdies":
        return <img src="/lovable-uploads/7e98fdc5-ab55-44e0-87ec-8b93e493b7e4.png" alt="Back-to-Back Birdies Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "No Bogey Round":
        return <img src="/lovable-uploads/1a37c1e5-56c0-4e02-a95a-cbfa8ce3a1b6.png" alt="No Bogey Round Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "Par Machine":
        return <img src="/lovable-uploads/51973f3e-599d-4110-bcf6-8eac43b963f8.png" alt="Par Machine Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      case "International Golfer":
        return <img src="/lovable-uploads/3c0146da-b965-42cc-b130-ef9c25727aad.png" alt="International Golfer Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      // Regional achievement badges
      case "Lynx Legend":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className={isMobile ? "w-24 h-24" : "w-40 h-40 rounded-lg"} />;
      case "The Continental Swinger":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Swinger Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40 rounded-lg"} />;
      case "Stars and Stripes Tourer":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className={isMobile ? "w-24 h-24" : "w-40 h-40 rounded-lg"} />;
      case "Legends Club":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Legends Club Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40 rounded-lg"} />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      default:
        return (
          <div className={`${isMobile ? "w-24 h-24 text-3xl" : "w-40 h-40 text-6xl"} flex items-center justify-center drop-shadow-lg ${!achievement.isEarned ? 'filter grayscale opacity-40' : ''}`}>
            {achievement.emoji}
          </div>
        );
    }
  };

  // ... (include all the achievement data from the original modal)
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "🏌️",
      isEarned: true,
      description: "Play 20 golf courses",
      xp: 100,
      isRepeatable: false,
      dateEarned: "2024-01-15"
    },
    {
      title: "50 Club",
      emoji: "⭐",
      isEarned: true,
      description: "Play 50 golf courses",
      xp: 250,
      isRepeatable: false,
      dateEarned: "2024-03-22"
    },
    {
      title: "100 Century Club",
      emoji: "🎯",
      isEarned: false,
      description: "Play 100 golf courses",
      xp: 500,
      isRepeatable: false,
      progress: "67/100",
      unlockHint: "Keep exploring new courses! You're well on your way."
    },
    // ... (continue with more achievements - simplified for brevity)
  ];

  const skillAchievements: Achievement[] = [
    {
      title: "Single-Figure Handicap",
      emoji: "🎯",
      isEarned: false,
      description: "Achieve a single-figure handicap (9 or below)",
      xp: 200,
      isRepeatable: false,
      unlockHint: "Keep practicing and playing competitive golf!"
    },
    // ... (continue with more achievements)
  ];

  const mostRecentAchievement = getMostRecentAchievement();

  return (
    <div className="w-full max-w-[1150px] mx-auto">
      {/* XP Progress Header */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'h-16' : 'h-auto'} overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 mb-6 relative`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <XPRingSystem 
                currentXP={totalXP}
                size="medium"
                layout="horizontal"
                showMiniRings={!isCollapsed}
              />
            </div>
            
            {!isCollapsed && (
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {totalXP.toLocaleString()} XP
                </h3>
                <p className="text-sm text-gray-600">
                  {(nextMilestone - totalXP).toLocaleString()} XP to {nextTier.name}
                </p>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="text-gray-600 hover:text-gray-900"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Most Recent Achievement */}
      {mostRecentAchievement && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 mb-6 border border-yellow-200">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">🏆</div>
            <div>
              <h3 className="font-semibold text-gray-900">Most Recent Achievement</h3>
              <p className="text-sm text-gray-600">{mostRecentAchievement.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'unlocked', label: 'Unlocked' },
          { key: 'locked', label: 'Locked' },
          { key: 'exploration', label: 'Exploration' },
          { key: 'skill', label: 'Skill' }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.key as any)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Achievement Sections */}
      <div ref={scrollRef} className="space-y-8">
        {/* Exploration Achievements */}
        {(activeFilter === 'all' || activeFilter === 'exploration') && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Experience & Exploration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement, index) => {
                const { percentage, nudgeText } = getAchievementProgress(achievement);
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      const modalData: AchievementModalData = {
                        id: achievement.title.replace(/\s+/g, '-').toLowerCase(),
                        name: achievement.title,
                        xp: achievement.xp,
                        unlocked: achievement.isEarned,
                        description: achievement.description,
                        unlockHint: achievement.unlockHint,
                        progress: achievement.progress,
                        dateEarned: achievement.dateEarned,
                        isRepeatable: achievement.isRepeatable
                      };
                      setSelectedAchievement(modalData);
                      setShowAchievementDetailModal(true);
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      achievement.isEarned 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getAchievementIcon(achievement)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${achievement.isEarned ? 'text-green-900' : 'text-gray-700'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.isEarned ? 'text-green-600' : 'text-gray-500'}`}>
                          {achievement.xp} XP
                        </p>
                        {achievement.progress && !achievement.isEarned && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{achievement.progress}</p>
                            {nudgeText && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">{nudgeText}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Skill Achievements */}
        {(activeFilter === 'all' || activeFilter === 'skill') && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Skill & Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredAchievements(skillAchievements, 'skill').map((achievement, index) => {
                const { percentage, nudgeText } = getAchievementProgress(achievement);
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      const modalData: AchievementModalData = {
                        id: achievement.title.replace(/\s+/g, '-').toLowerCase(),
                        name: achievement.title,
                        xp: achievement.xp,
                        unlocked: achievement.isEarned,
                        description: achievement.description,
                        unlockHint: achievement.unlockHint,
                        progress: achievement.progress,
                        dateEarned: achievement.dateEarned,
                        isRepeatable: achievement.isRepeatable
                      };
                      setSelectedAchievement(modalData);
                      setShowAchievementDetailModal(true);
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      achievement.isEarned 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getAchievementIcon(achievement)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${achievement.isEarned ? 'text-green-900' : 'text-gray-700'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.isEarned ? 'text-green-600' : 'text-gray-500'}`}>
                          {achievement.xp} XP
                        </p>
                        {achievement.progress && !achievement.isEarned && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{achievement.progress}</p>
                            {nudgeText && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">{nudgeText}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
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

export default AchievementsTabContent;