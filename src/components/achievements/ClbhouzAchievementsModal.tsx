// ClbhouzAchievementsModal - Achievement Modal
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XPRingSystem } from "@/components/profile/XPRingSystem";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';


// Achievement badge imports - using user's uploaded image
// import club300Badge from '@/assets/achievements/300-club-champion.png';

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
  console.log('ClbhouzAchievementsModal rendering - v2.0');
  
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
  
  // Clear any cached references by forcing recompilation
  
  
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

  // Animation trigger when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateProgress(true), 300);
      return () => clearTimeout(timer);
    } else {
      setAnimateProgress(false);
    }
  }, [isOpen]);

  // Smart scroll detection with direction threshold and debouncing
  useEffect(() => {
    if (!isOpen) return;
    
    // Add a small delay to ensure the modal is fully rendered
    const timeoutId = setTimeout(() => {
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
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (scrollDebounceTimer.current) clearTimeout(scrollDebounceTimer.current);
      if (directionChangeTimer.current) clearTimeout(directionChangeTimer.current);
    };
  }, [isOpen, isManuallyCollapsed]);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsManuallyCollapsed(false);
      setIsCollapsed(false);
      lastScrollTop.current = 0;
      scrollDirection.current = 'idle';
      
      // Clear timers
      if (scrollDebounceTimer.current) clearTimeout(scrollDebounceTimer.current);
      if (directionChangeTimer.current) clearTimeout(directionChangeTimer.current);
    }
  }, [isOpen]);

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
      // Regional achievement badges with flag images
      case "Lynx Legend":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "The Continental Swinger":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Swinger Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Stars and Stripes Tourer":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Legends Club":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Legends Club Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      default:
        // Enhanced emoji display with conditional styling - hide emojis on mobile for Experience/Exploration section
        if (isMobile && (achievement.title.includes('Club') || ['Lynx Legend', 'The Continental Swinger', 'Stars and Stripes Tourer', 'Legends Club'].includes(achievement.title))) {
          return (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Badge</span>
            </div>
          );
        }
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
      unlockHint: "Continue exploring new courses and add them to your tracker. You're getting close!"
    },
    {
      title: "200 Clubhouse Elite",
      emoji: "🏆",
      isEarned: false,
      description: "Elite status: 200 courses played. Golf course connoisseur level achieved!",
      xp: 1000,
      isRepeatable: false,
      progress: "78 / 200 courses",
      unlockHint: "Keep visiting new courses and documenting your golf journey. This is a long-term goal!"
    },
    {
      title: "300 Club Champion",
      emoji: "👑",
      isEarned: false,
      description: "Legendary achievement: 300 courses played. You're a true golf course explorer!",
      xp: 1500,
      isRepeatable: false,
      progress: "78 / 300 courses",
      unlockHint: "The ultimate goal for golf course enthusiasts. Continue your incredible journey!"
    },
    {
      title: "Lynx Legend",
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      isEarned: false,
      description: "Great Britain and Ireland, You've Mastered the Finest Across the British Isles",
      xp: 3000,
      isRepeatable: false,
      progress: "12 / 20 courses",
      unlockHint: "Explore the historic golf courses across England, Scotland, Wales, and Ireland. You're making great progress!"
    },
    {
      title: "The Continental Swinger",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Continental Europe, From Algarve to the Alps, Europe's Elite Courses, Conquered",
      xp: 3000,
      isRepeatable: false,
      progress: "3 / 8 countries",
      unlockHint: "Plan golf trips across Europe. Consider France, Spain, Portugal, Germany, and other European golf destinations."
    },
    {
      title: "Stars and Stripes Tourer",
      emoji: "🇺🇸",
      isEarned: false,
      description: "USA. Coast to Coast you've played the American Greats",
      xp: 3000,
      isRepeatable: false,
      progress: "1 / 10 states",
      unlockHint: "Plan golf trips to different US states. Consider popular golf destinations like Florida, California, or Arizona."
    },
    {
      title: "Legends Club",
      emoji: "🌍",
      isEarned: false,
      description: "World Wide Top 100. From Seve, to Tiger, to Jack, Legends have walked where you now stand. You've joined Golf's most elite circle. Welcome.",
      xp: 5000,
      isRepeatable: false,
      progress: "1 / 4 continents",
      unlockHint: "Expand your golf travels internationally. Each continent offers unique golf experiences and challenges."
    },
    {
      title: "Marathon Golfer",
      emoji: "🏃",
      isEarned: false,
      description: "Ten days, ten courses, one epic streak.",
      xp: 400,
      isRepeatable: false,
      progress: "0 / 10 consecutive days",
      unlockHint: "Plan a golf trip with multiple courses or play daily at different local courses for 10 days straight."
    },
    {
      title: "Globetrotter Golfer",
      emoji: "🌐",
      isEarned: false,
      description: "Tee it up on three continents and own the world.",
      xp: 600,
      isRepeatable: false,
      progress: "1 / 3 continents",
      unlockHint: "Plan international golf trips to expand your global golf experience across different continents."
    },
    {
      title: "One Day, Two Courses",
      emoji: "⚡",
      isEarned: false,
      description: "36 holes, two courses, all in a day's work.",
      xp: 200,
      isRepeatable: true,
      progress: "Not achieved",
      unlockHint: "Book tee times at two different courses in the same day. Start early and plan your travel time between courses."
    },
  ];

  // Skill & Performance Achievements
  const skillAchievements: Achievement[] = [
    {
      title: "Single-Figure Handicap",
      emoji: "🏆",
      isEarned: false,
      description: "Achieve a single-digit handicap (0-9). A mark of consistent, skilled play.",
      xp: 250,
      isRepeatable: false,
      progress: "Current: 12.3",
      unlockHint: "Keep improving your scoring consistency. Play more rounds and work on course management."
    },
    {
      title: "Plus Handicap Player",
      emoji: "⭐",
      isEarned: false,
      description: "Reach plus handicap status. Elite level golf achievement.",
      xp: 500,
      isRepeatable: false,
      progress: "Target: +0.0",
      unlockHint: "Master all aspects of your game and consistently shoot under par. This requires dedication and practice."
    },
    {
      title: "Single-Figure Handicap",
      emoji: "🎯", 
      isEarned: true,
      description: "Achieve a single-digit handicap. Elite golfing status!",
      xp: 150,
      isRepeatable: true,
      progress: "Achieved: Handicap 8.5",
      dateEarned: "February 8, 2024"
    },
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: true,
      description: "Score your first eagle (2 under par). A memorable milestone!",
      xp: 100,
      isRepeatable: false,
      progress: "Completed",
      dateEarned: "January 22, 2024"
    },
    {
      title: "Albatross Ace",
      emoji: "🦅",
      isEarned: false,
      description: "Score the rarest shot in golf — In the hole for 2 on a par 5.",
      xp: 1000,
      isRepeatable: true,
      progress: "0 albatrosses",
      unlockHint: "Look for reachable par 5s and take calculated risks when the conditions are right. This is golf's rarest achievement."
    },
    {
      title: "Birdie Blitz",
      emoji: "🐦",
      isEarned: false,
      description: "Score 3 or more birdies in a single round. On fire!",
      xp: 75,
      isRepeatable: true,
      progress: "Best: 2 birdies",
      unlockHint: "Focus on approach shots and putting. Target par 4s and 5s where birdies are most achievable."
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Accumulate 5 total eagles throughout your golf journey.",
      xp: 250,
      isRepeatable: false,
      progress: "2 / 5 eagles",
      unlockHint: "Look for eagle opportunities on par 5s and short par 4s. Aggressive play when the situation is right."
    },
    {
      title: "Hole-in-One",
      emoji: "🕳️",
      isEarned: false,
      description: "The ultimate golf achievement - ace a hole! Each one counts.",
      xp: 500,
      isRepeatable: true,
      progress: "0 aces",
      unlockHint: "Play more par 3s and focus on accuracy. Sometimes luck plays a part, but skill increases your chances."
    },
    {
      title: "Back-to-Back Birdies",
      emoji: "🎪",
      isEarned: false,
      description: "Score consecutive birdies. Momentum is everything!",
      xp: 100,
      isRepeatable: false,
      progress: "Not achieved",
      unlockHint: "Maintain focus and positive momentum after making your first birdie. Stay aggressive but smart."
    },
    {
      title: "No Bogey Round",
      emoji: "💯",
      isEarned: false,
      description: "Complete a round without any bogeys. Consistency at its finest.",
      xp: 200,
      isRepeatable: false,
      progress: "Best: 2 bogeys",
      unlockHint: "Focus on course management over aggressive play. Avoid double bogeys and play within your abilities."
    },
    {
      title: "International Golfer",
      emoji: "✈️",
      isEarned: true,
      description: "Play golf in 3 or more countries. Global golf adventurer!",
      xp: 150,
      isRepeatable: false,
      progress: "4 countries",
      dateEarned: "December 10, 2023"
    },
    {
      title: "Sunrise to Sunset",
      emoji: "☀️",
      isEarned: false,
      description: "Play 2 rounds in a single day. True dedication to the game!",
      xp: 125,
      isRepeatable: true,
      progress: "Not achieved",
      unlockHint: "Book morning and afternoon tee times at the same course. Make sure to stay hydrated and energized."
    },
    {
      title: "Club Loyalist",
      emoji: "🏠",
      isEarned: false,
      description: "Play 50 rounds at your home club. True club spirit and loyalty!",
      xp: 350,
      isRepeatable: false,
      progress: "23 / 50 rounds",
      unlockHint: "Continue playing regularly at your home club. Join club events and competitions to reach this milestone faster."
    },
    {
      title: "Par Machine",
      emoji: "🤖",
      isEarned: false,
      description: "Eighteen holes, eighteen pars. Flawless.",
      xp: 300,
      isRepeatable: false,
      progress: "Best: 16 pars",
      unlockHint: "Focus on consistency and course management. Avoid risky shots and play to the center of greens."
    },
    {
      title: "Birdie Every Par",
      emoji: "🎯",
      isEarned: false,
      description: "Conquer a par 3, 4, and 5 in one round.",
      xp: 150,
      isRepeatable: true,
      progress: "Not achieved",
      unlockHint: "Target different par holes strategically. Look for opportunities on shorter par 4s and reachable par 5s."
    }
  ];
  // Get the most recently unlocked achievement after both arrays are defined
  const mostRecentAchievement = getMostRecentAchievement();
  // Body scroll lock effect for mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, parseInt(document.body.style.top || '0') * -1);
      };
    }
  }, [isOpen, isMobile]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile ? 'max-w-[95vw] max-h-[90vh] p-0' : 'max-w-4xl max-h-[85vh] p-0'} 
        overflow-hidden flex flex-col bg-white
      `}
      >
        <DialogHeader className={`${isMobile ? 'p-4 pb-2' : 'p-6 pb-4'} flex-shrink-0 text-center`}>
          <DialogTitle className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-black dark:text-white text-center`}>
            Achievements
          </DialogTitle>
          <DialogDescription className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mt-1 text-center`}>
            Defining your game through achievement
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
          style={{ 
            scrollbarWidth: 'thin',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehaviorY: 'contain'
          }}
        >
          {/* Header with Title Left and User Profile Right */}
          <div className={`${isMobile ? 'px-4 pb-2' : 'px-6 pb-4'}`}>
            <div className={`flex justify-between items-center ${isMobile ? 'p-3' : 'p-4'}`}>
              {/* Left side - Title and subtitle */}
              <div className="text-left">
                <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-black dark:text-white mb-1`}>Achievements</h2>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Track your golf progress</p>
              </div>

              {/* Right side - User Profile */}
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold ${isMobile ? 'text-xs' : 'text-lg'}`}>
                  {userProfilePhotoUrl ? (
                    <img 
                      src={userProfilePhotoUrl} 
                      alt={userDisplayName} 
                      className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover`}
                    />
                  ) : (
                    userDisplayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left">
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>{userDisplayName}</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible XP Progress Header with Smooth Animations */}
          <div className={`sticky top-0 z-10 bg-card/95 backdrop-blur-sm transition-all duration-400 ease-in-out ${
            isCollapsed 
              ? isMobile ? 'px-4 py-2' : 'px-6 py-3' 
              : isMobile ? 'px-4 pb-3' : 'px-6 pb-4'
          }`}>
            {isCollapsed ? (
              /* Collapsed Mini View */
              <div className={`flex items-center justify-between ${
                isMobile ? 'p-2 max-h-[52px]' : 'p-3'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`relative ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
                    <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} transform -rotate-90`} viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-gray-300 dark:text-gray-600"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke={nextTier.color}
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={`${14 * 2 * Math.PI}`}
                        strokeDashoffset={`${14 * 2 * Math.PI * (1 - progressPercentage / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <Trophy className={`absolute inset-0 m-auto text-muted-foreground ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                    {totalXP.toLocaleString()} XP | {progressPercentage.toFixed(0)}% to {nextTier.name}
                  </div>
                </div>
                <div className={`flex-1 mx-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${isMobile ? 'h-1.5' : 'h-2'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: animateProgress ? `${progressPercentage}%` : '0%',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                    }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {!isMobile && (
                    <div className="text-xs text-muted-foreground">
                      Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCollapse}
                    className={`p-1 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}
                  >
                    <ChevronDown className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                  </Button>
                </div>
              </div>
            ) : (
              /* Full XP Ring Section - Mobile Optimized */
              <div className={`relative overflow-hidden ${
                isMobile ? 'p-3' : 'p-6'
              }`}>
                {/* Celebration Animation Overlay */}
                {showCelebration && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl animate-pulse">
                    <div className={`${isMobile ? 'text-4xl' : 'text-6xl'} animate-bounce`}>🎉</div>
                  </div>
                )}
                
                {/* Mobile Stacked Layout */}
                {isMobile ? (
                  <div className="space-y-3">
                    {/* Header with collapse button */}
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                         <div className="text-xl font-bold text-foreground flex items-center justify-center gap-2 mb-1">
                           {totalXP.toLocaleString()} XP
                         </div>
                        
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleCollapse}
                        className="p-1 h-6 w-6"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Next ring text and toggle */}
                    <div className="text-center text-xs text-muted-foreground">
                      Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
                    </div>
                  </div>
                ) : (
                  /* Desktop Header Layout */
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">XP Progress</h3>
                        
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                           <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                             {totalXP.toLocaleString()} XP
                           </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleToggleCollapse}
                          className="p-1 h-8 w-8"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Main Progress Ring and Info - Desktop Only */}
                {!isMobile && (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center gap-12">
                        {/* Enhanced Progress Ring */}
                        <div className="relative flex-shrink-0">
                          <div className="relative w-40 h-40">
                            
                            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                              {/* Background circle */}
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-gray-300 dark:text-gray-600"
                              />
                              {/* Animated progress circle */}
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={`url(#progressGradient)`}
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={`${70 * 2 * Math.PI}`}
                                strokeDashoffset={animateProgress ? 
                                  `${70 * 2 * Math.PI * (1 - progressPercentage / 100)}` : 
                                  `${70 * 2 * Math.PI}`
                                }
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                              {/* Gradient definition */}
                              <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#3B82F6" />
                                  <stop offset="50%" stopColor="#8B5CF6" />
                                  <stop offset="100%" stopColor="#06B6D4" />
                                </linearGradient>
                              </defs>
                            </svg>
                            
                            {/* Subtle glow effect around the ring */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div 
                                className="absolute opacity-20 animate-pulse rounded-full"
                                style={{
                                  top: '15px',
                                  left: '15px',
                                  right: '15px',
                                  bottom: '15px',
                                  background: `conic-gradient(from 0deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3))`,
                                  filter: 'blur(8px)',
                                  borderRadius: '50%'
                                }}
                              />
                            </div>
                            
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold text-foreground mb-1">
                                {(nextTier.minXP - totalXP).toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground text-center mb-2">
                                XP to next ring
                              </div>
                              <div className="text-xs font-medium" style={{ color: nextTier.color }}>
                                {Math.round(progressPercentage)}% Complete
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Ring Info */}
                        <div className="w-64 space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-xl text-muted-foreground">
                              {currentTier ? currentTier.name : 'No Ring Achieved'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {currentTier ? 
                                `Congratulations! You've earned the ${currentTier.name}!` :
                                `Reach ${nextTier.minXP.toLocaleString()} XP to unlock your first ring`
                              }
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: nextTier.color }}>
                              <Trophy className="w-4 h-4" />
                              Next: {nextTier.name} at {nextTier.minXP.toLocaleString()} XP
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </>
                )}

                {/* Ring Tier Display */}
                <div className="w-full mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">Ring Progression</h4>
                  <div className="flex justify-between items-center gap-2">
                     {xpTiers.map((tier, index) => {
                       const isActive = totalXP >= tier.minXP;
                       const isCurrent = currentTier?.name === tier.name;
                       const isNext = nextTier?.name === tier.name;
                       
                       // Calculate progress for this specific tier
                       let tierProgress = 0;
                       if (isActive) {
                         // Tier is completed, show 100%
                         tierProgress = 100;
                       } else if (isCurrent || isNext) {
                         // This is the tier being worked towards
                         const tierStart = index === 0 ? 0 : xpTiers[index - 1].minXP;
                         const tierEnd = tier.minXP;
                         const tierRange = tierEnd - tierStart;
                         const currentProgress = Math.max(0, totalXP - tierStart);
                         tierProgress = Math.min(100, (currentProgress / tierRange) * 100);
                       }
                       
                       return (
                          <div key={tier.name} className="flex-1 text-center">
                             <div className="relative flex justify-center mb-2">
                               {/* Progress ring above titles */}
                               <svg className={`w-16 h-16 transform -rotate-90 ${isNext && !isActive ? 'animate-pulse' : ''}`} viewBox="0 0 64 64">
                                 {/* Background circle */}
                                 <circle
                                   cx="32"
                                   cy="32"
                                   r="30"
                                   stroke="currentColor"
                                   strokeWidth="3"
                                   fill="transparent"
                                   className="text-gray-300 dark:text-gray-600"
                                 />
                                 {/* Progress circle */}
                                 {tierProgress > 0 && (
                                   <circle
                                     cx="32"
                                     cy="32"
                                     r="30"
                                     stroke={tier.color}
                                     strokeWidth="3"
                                     fill="transparent"
                                     strokeDasharray={`${30 * 2 * Math.PI}`}
                                     strokeDashoffset={`${30 * 2 * Math.PI * (1 - tierProgress / 100)}`}
                                     strokeLinecap="round"
                                     className="transition-all duration-700"
                                   />
                                 )}
                               </svg>
                               
                               {/* Padlock icon for locked rings */}
                               {!isActive && !isNext && (
                                 <div className="absolute inset-0 flex items-center justify-center">
                                   <img 
                                     src="/lovable-uploads/b9837878-ceb4-4653-b157-cfe4045aac1d.png" 
                                     alt="Locked" 
                                     className="w-6 h-6 opacity-60"
                                   />
                                 </div>
                               )}
                             </div>
                           <div className="text-xs font-medium mb-1" style={{ color: isActive ? tier.color : '#6B7280' }}>
                             {tier.name}
                           </div>
                           <div className="text-xs text-muted-foreground">
                             {tier.minXP.toLocaleString()} XP
                           </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Featured Most Recent Achievement */}
          {mostRecentAchievement && (
            <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
              <div className="relative">
                {/* Featured Achievement Card */}
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    {/* Large Badge with CSS Animation */}
                    <div className="relative animate-scale-in">
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative drop-shadow-2xl hover:scale-105 transition-transform duration-300">
                        {getFeaturedAchievementIcon(mostRecentAchievement)}
                      </div>
                    </div>
                    
                    {/* Achievement Title with Fade Animation */}
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 animate-fade-in">
                      {mostRecentAchievement.title}
                    </h3>
                    
                    {/* XP Gained */}
                    <div className="font-bold text-lg text-blue-500 animate-scale-in">
                      +{mostRecentAchievement.xp} XP
                    </div>
                    
                    {/* Date Earned */}
                    <p className="text-sm text-muted-foreground animate-fade-in">
                      Unlocked {mostRecentAchievement.dateEarned}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Buttons - Mobile Optimized */}
          <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
            {isMobile ? (
              /* Mobile: Full width layout */
              <div className="space-y-2">
                <div className="flex gap-1 w-full">
                  {['all', 'unlocked', 'locked'].map((filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(filter as typeof activeFilter)}
                      className={`
                        capitalize transition-all duration-200 text-xs h-8 flex-1
                        ${activeFilter === filter 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'hover:bg-muted/80'
                        }
                      `}
                    >
                      {filter === 'all' ? 'All' : 
                       filter === 'unlocked' ? 'Unlocked' :
                       'Locked'}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1 w-full">
                  {['exploration', 'skill'].map((filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(filter as typeof activeFilter)}
                      className={`
                        capitalize transition-all duration-200 text-xs h-8 flex-1
                        ${activeFilter === filter 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'hover:bg-muted/80'
                        }
                      `}
                    >
                      {filter === 'exploration' ? 'Exploration' : 'Skill-Based'}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              /* Desktop: single row layout */
              <div className="flex flex-wrap gap-2 justify-center">
                {['all', 'unlocked', 'locked', 'exploration', 'skill'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter as typeof activeFilter)}
                    className={`
                      capitalize transition-all duration-200 hover:scale-105
                      ${activeFilter === filter 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-muted/80'
                      }
                    `}
                  >
                     {filter === 'all' ? 'All Achievements' : 
                      filter === 'unlocked' ? 'Unlocked' :
                      filter === 'locked' ? 'Locked' :
                     filter === 'exploration' ? 'Experience & Exploration' :
                     'Skill-Based'}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Experience & Exploration Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
            <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
              {/* Card Container with Visual Grouping */}
              <div className="p-6">
                {/* Section Header with Icon */}
                  <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                      Experience & Exploration Achievements
                    </h3>
                  </div>
                
                  <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-6'}`}>
                    {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement) => {
                      const { percentage, nudgeText } = getAchievementProgress(achievement);
                      const isNearUnlock = percentage >= 80 && percentage < 100;
                      
                      return (
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
                                unlockHint: achievement.unlockHint,
                                progress: achievement.progress,
                                dateEarned: achievement.dateEarned,
                                isRepeatable: achievement.isRepeatable
                              });
                              setShowAchievementDetailModal(true);
                            }}
                            onMouseEnter={!isMobile ? () => {
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
                            } : undefined}
                            onMouseLeave={!isMobile ? () => {
                              setShowAchievementDetailModal(false);
                              setSelectedAchievement(null);
                            } : undefined}
                                 >
                                  {/* Icon directly on background - no container */}
                                  <div className="flex justify-center items-center">
                                    <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                                      {getAchievementIcon(achievement)}
                                    </div>
                                  </div>
                                  
                                  {/* Text stacked underneath */}
                                  <div className="text-center">
                                    <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
                                      {achievement.title.toUpperCase()}
                                    </h4>
                                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${achievement.isEarned ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                      +{achievement.xp} XP
                                    </p>
                                  </div>
                                  
                                   {/* Smart Nudge Label */}
                                   {nudgeText && (
                                     <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                                       <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-tight">
                                         🎯 {nudgeText}
                                       </p>
                                     </div>
                                   )}
                                 </div>
                               
                               {/* Progress indicator for near-unlock achievements */}
                               {isNearUnlock && (
                                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                               )}
                             </div>
                      );
                    })}
                   </div>
               </div>
            </div>
          )}

          {/* Skill & Performance Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'skill') && getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
            <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
              {/* Card Container with Visual Grouping */}
              <div className="p-6">
                {/* Section Header with Icon */}
                  <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                      Skill & Performance Achievements
                    </h3>
                  </div>
                
                  <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-6'}`}>
                    {getFilteredAchievements(skillAchievements, 'skill').map((achievement) => {
                      const { percentage, nudgeText } = getAchievementProgress(achievement);
                      const isNearUnlock = percentage >= 80 && percentage < 100;
                      
                      return (
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
                                unlockHint: achievement.unlockHint,
                                progress: achievement.progress,
                                dateEarned: achievement.dateEarned,
                                isRepeatable: achievement.isRepeatable
                              });
                              setShowAchievementDetailModal(true);
                            }}
                            onMouseEnter={!isMobile ? () => {
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
                            } : undefined}
                            onMouseLeave={!isMobile ? () => {
                              setShowAchievementDetailModal(false);
                              setSelectedAchievement(null);
                            } : undefined}
                                 >
                                  {/* Icon directly on background - no container */}
                                  <div className="flex justify-center items-center">
                                    <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                                      {getAchievementIcon(achievement)}
                                    </div>
                                  </div>
                                  
                                  {/* Text stacked underneath */}
                                  <div className="text-center">
                                    <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                                      {achievement.title.toUpperCase()}
                                    </h4>
                                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${achievement.isEarned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                      +{achievement.xp} XP
                                    </p>
                                  </div>
                                  
                                  {/* Smart Nudge Label */}
                                  {nudgeText && (
                                    <div className="mt-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-tight">
                                        🎯 {nudgeText}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              
                               {/* Progress indicator for near-unlock achievements */}
                               {isNearUnlock && (
                                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                               )}
                             </div>
                      );
                    })}
                   </div>
               </div>
             </div>
           )}

        </div>

      </DialogContent>
      
      {/* Achievement Detail Modal - Moved outside the main Dialog to prevent nesting issues */}
      {isOpen && (
        <AchievementDetailModal
          isOpen={showAchievementDetailModal}
          onClose={() => setShowAchievementDetailModal(false)}
          achievement={selectedAchievement}
        />
      )}
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;