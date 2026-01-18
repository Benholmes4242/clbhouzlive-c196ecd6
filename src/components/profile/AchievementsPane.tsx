// AchievementsPane - Complete inline achievements for Profile page
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { MdOutlineTrendingUp } from 'react-icons/md';
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';
import { OptimizedMedalIcon } from '@/components/ui/optimized-medal-icon';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { MILESTONE_TIER_META } from '@/config/achievements';
// Using the user's original padlock image
const padlockIcon = '/lovable-uploads/fa944ae3-272a-4bae-82bf-06e9bde7d784.png';

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
  
  // Fetch real Top 100 progress data for the user
  const { data: top100Progress } = useTop100ProgressForUser(userId);
  const totalTop100Played = top100Progress?.totalTop100Played ?? 0;
  
  // Mock data for XP system (can be replaced later)
  const totalXP = 2500;
  const nextMilestone = 10000;
  const progressPercentage = (totalXP / nextMilestone) * 100;
  
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

  // Get filter count
  const getFilterCount = (filter: 'all' | 'unlocked' | 'locked' | 'exploration' | 'skill') => {
    const allAchievements = [...explorationAchievements, ...skillAchievements];
    
    switch (filter) {
      case 'all':
        return allAchievements.length;
      case 'unlocked':
        return allAchievements.filter(a => a.isEarned).length;
      case 'locked':
        return allAchievements.filter(a => !a.isEarned).length;
      case 'exploration':
        return explorationAchievements.length;
      case 'skill':
        return skillAchievements.length;
      default:
        return 0;
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
    console.log('Getting featured icon for achievement:', achievement.title, 'with emoji:', achievement.emoji);
    
    // Use specific badge images directly for featured display to avoid fallback issues
    switch (achievement.title) {
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
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
      case "Great Britain & Ireland":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Continental Europe":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Europe Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "USA":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Worldwide":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Worldwide Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      default:
        // Fallback for unmapped achievements
        console.log('Using fallback emoji for achievement:', achievement.title);
        return (
          <div className={`${isMobile ? "w-24 h-24" : "w-40 h-40"} text-6xl flex items-center justify-center drop-shadow-lg`}>
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
      case "Great Britain & Ireland":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Continental Europe":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Europe Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "USA":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Worldwide":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Worldwide Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-40 h-40 rounded-lg"} />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className={isMobile ? "w-24 h-24" : "w-40 h-40"} />;
      default:
        // Enhanced emoji display with conditional styling - hide emojis on mobile for Experience/Exploration section
        if (isMobile && (achievement.title.includes('Club') || ['Great Britain & Ireland', 'Continental Europe', 'USA', 'Worldwide'].includes(achievement.title))) {
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

  // Top 100 Milestone Achievements - dynamically computed from real data
  const top100MilestoneAchievements: Achievement[] = useMemo(() => {
    // Define metadata for each milestone (maps to MILESTONE_TIER_META thresholds)
    const milestoneMetadata: Record<number, { title: string; emoji: string; description: string; xp: number }> = {
      5: {
        title: "5 Club",
        emoji: "🏌️",
        description: "Play your first 5 Top 100 courses. The journey begins!",
        xp: 50
      },
      10: {
        title: "10 Club",
        emoji: "⭐",
        description: "Reach 10 Top 100 courses played. You're building momentum!",
        xp: 100
      },
      20: {
        title: "20 Club",
        emoji: "🎯",
        description: "Play 20 Top 100 courses. Welcome to the clubhouse!",
        xp: 200
      },
      50: {
        title: "50 Club",
        emoji: "🏆",
        description: "Reach the milestone of 50 Top 100 courses played. You're getting serious!",
        xp: 300
      },
      100: {
        title: "100 Century Club",
        emoji: "💯",
        description: "Join the exclusive 100 courses club. True dedication to the game!",
        xp: 500
      },
      200: {
        title: "200 Clubhouse Elite",
        emoji: "👑",
        description: "Elite status: 200 courses played. Golf course connoisseur level achieved!",
        xp: 1000
      },
      300: {
        title: "300 Club Champion",
        emoji: "🌟",
        description: "Legendary achievement: 300 courses played. You're a true golf course explorer!",
        xp: 1500
      },
      400: {
        title: "400 Grand Slam",
        emoji: "🏅",
        description: "The pinnacle: 400 Top 100 courses. You've conquered the golf world!",
        xp: 2000
      }
    };

    return MILESTONE_TIER_META.map(tier => {
      const isEarned = totalTop100Played >= tier.threshold;
      const meta = milestoneMetadata[tier.threshold];
      
      return {
        title: meta?.title ?? `${tier.threshold} Club`,
        emoji: meta?.emoji ?? "🏌️",
        isEarned,
        description: meta?.description ?? `Play ${tier.threshold} Top 100 courses.`,
        xp: meta?.xp ?? tier.threshold * 10,
        isRepeatable: false,
        progress: `${Math.min(totalTop100Played, tier.threshold)} / ${tier.threshold} courses`,
        dateEarned: isEarned ? undefined : undefined, // Could be enhanced with actual date tracking
        unlockHint: isEarned ? undefined : `Play ${tier.threshold - totalTop100Played} more Top 100 courses to unlock!`
      };
    });
  }, [totalTop100Played]);

  // Exploration & Travel Achievements (non-milestone achievements - keep existing data for now)
  const explorationAchievements: Achievement[] = [
    // Include the dynamically computed Top 100 milestone achievements
    ...top100MilestoneAchievements,
    // Additional exploration achievements (non-Top-100 milestones)
    {
      title: "Great Britain & Ireland",
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      isEarned: false,
      description: "Great Britain and Ireland, You've Mastered the Finest Across the British Isles",
      xp: 3000,
      isRepeatable: false,
      progress: "12 / 20 courses",
      unlockHint: "Explore the historic golf courses across England, Scotland, Wales, and Ireland. You're making great progress!"
    },
    {
      title: "Continental Europe",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Continental Europe, From Algarve to the Alps, Europe's Elite Courses, Conquered",
      xp: 3000,
      isRepeatable: false,
      progress: "3 / 8 countries",
      unlockHint: "Plan golf trips across Europe. Consider France, Spain, Portugal, Germany, and other European golf destinations."
    },
    {
      title: "USA",
      emoji: "🇺🇸",
      isEarned: false,
      description: "USA. Coast to Coast you've played the American Greats",
      xp: 3000,
      isRepeatable: false,
      progress: "1 / 10 states",
      unlockHint: "Plan golf trips to different US states. Consider popular golf destinations like Florida, California, or Arizona."
    },
    {
      title: "Worldwide",
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
      isEarned: true,
      description: "Score 3 or more birdies in a single round. On fire!",
      xp: 75,
      isRepeatable: true,
      progress: "Best: 3 birdies",
      dateEarned: "August 8, 2025"
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

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className={`w-full flex flex-col bg-background`}>
        <div className="px-4 py-8 md:px-8 w-full">
        </div>
        
        <div className="w-full" style={{ paddingTop: isMobile ? '0px' : '0px', paddingBottom: isMobile ? '130px' : '60px' }}>

          {/* Hero XP Progress Section - Desktop Only */}
          {!isMobile && (
            <div className="flex justify-center px-6 pb-8">
              <div className="flex items-center justify-center gap-12">
                {/* Large Progress Ring on the Left */}
                <div className="relative flex-shrink-0">
                  <div className="relative w-80 h-80">
                    <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 320 320" style={{ filter: 'blur(0.2px) drop-shadow(0 0 8px #10B98130)' }}>
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="greenProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#34D399" />
                          <stop offset="100%" stopColor="#6EE7B7" />
                        </linearGradient>
                      </defs>
                      
                      {/* Background ring */}
                      <circle
                        cx="160"
                        cy="160"
                        r="140"
                        fill="none"
                        stroke="#E6F7F1"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      
                      {/* Animated progress circle */}
                      <circle
                        cx="160"
                        cy="160"
                        r="140"
                        stroke="#10B981"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${140 * 2 * Math.PI}`}
                        strokeDashoffset={animateProgress ? 
                          `${140 * 2 * Math.PI * (1 - progressPercentage / 100)}` : 
                          `${140 * 2 * Math.PI}`
                        }
                        strokeLinecap="round"
                        className="transition-all duration-2000 ease-out"
                      />
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
                      <div className="text-5xl font-bold text-foreground mb-3">
                        {totalXP.toLocaleString()} XP
                      </div>
                      <div className="text-base font-medium text-center leading-tight max-w-[200px] text-green-500">
                        {(nextTier.minXP - totalXP).toLocaleString()} XP remaining to unlock your {nextTier.name.split(' ')[0].toLowerCase()} ring
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Side Info */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Ring Achievement Status - Centered with ring */}
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
                  
                  {/* XP Earned This Month - Below centered content */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-3 text-green-600 relative px-4 py-2">
                      {/* Light green glow across entire section */}
                      <div className="absolute inset-0 bg-green-400/40 rounded-lg blur-md shadow-lg shadow-green-300/50"></div>
                      <span className="text-sm font-medium relative z-10">XP earned this month</span>
                      <div className="flex items-center gap-1 relative z-10">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold">450 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Achievements Title and Subtitle - Between large and small rings */}
          {!isMobile && (
            <div className="flex justify-center items-center px-6 pb-8">
              <div className="text-center">
                <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-black dark:text-white`}>
                  Achievements
                </h1>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-black dark:text-white mt-1`}>
                  Defining your game through achievement
                </p>
              </div>
            </div>
          )}
          
          {/* Hero XP Progress Section - Mobile Only */}
          {isMobile && (
            <div className="px-4 pb-6">
              <div className="flex items-center gap-6 w-full">{/* Remove centering container and max-width */}
                {/* Mobile Progress Ring - Left Side */}
                <div className="relative flex-shrink-0">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128" style={{ filter: 'blur(1px) drop-shadow(0 0 15px #10B98160)' }}>
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="greenProgressGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#34D399" />
                          <stop offset="100%" stopColor="#6EE7B7" />
                        </linearGradient>
                      </defs>
                      
                      {/* Background ring */}
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#E6F7F1"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      
                      {/* Animated progress circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10B981"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${56 * 2 * Math.PI}`}
                        strokeDashoffset={animateProgress ? 
                          `${56 * 2 * Math.PI * (1 - progressPercentage / 100)}` : 
                          `${56 * 2 * Math.PI}`
                        }
                        strokeLinecap="round"
                        className="transition-all duration-2000 ease-out"
                      />
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
                      <div className="text-lg font-bold text-foreground mb-1">
                        {totalXP.toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        XP
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Info Section - Right Side */}
                <div className="flex flex-col justify-center flex-1 space-y-2">
                  {/* Ring Achievement Status */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-black dark:text-white leading-tight">
                      {currentTier ? currentTier.name : "No Ring Achieved"}
                    </h3>
                    <p className="text-base text-black dark:text-white leading-tight">
                      {currentTier ? 
                        `You've earned the ${currentTier.name}!` :
                        `${nextTier.minXP.toLocaleString()} XP to unlock your first ring`
                      }
                    </p>
                  </div>
                  
                  {/* XP Progress Text */}
                  <div className="text-base text-green-500 leading-tight">
                    {(nextTier.minXP - totalXP).toLocaleString()} XP to {nextTier.name.split(" ")[0].toLowerCase()} ring
                  </div>
                  
                   {/* Monthly Gain */}
                   <div className="flex items-center gap-2">
                     <div className="flex items-center gap-2 text-green-600 relative px-3 py-2">
                       <div className="absolute inset-0 bg-green-400/30 rounded blur-sm"></div>
                       <span className="text-base font-medium relative z-10">Monthly Gain:</span>
                       <span className="font-bold relative z-10 text-base">450 XP</span>
                       <MdOutlineTrendingUp className="w-6 h-6 relative z-10" />
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Complete Section */}
          {isMobile && (
            <div className="px-4 pb-6">
              {/* Achievements Title */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-black dark:text-white">
                  Achievements
                </h1>
                <p className="text-sm text-black dark:text-white mt-1">
                  Defining your game through achievement
                </p>
              </div>
              
              {/* Ring Progression Section - Mobile */}
              <div className="mb-6">
                 <div className="relative flex justify-between items-center gap-1">
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
                        <div className="relative flex justify-center mb-1">
                          {/* Progress ring */}
                          <svg className={`w-16 h-16 transform -rotate-90 ${isNext && !isActive ? 'animate-pulse' : ''}`} viewBox="0 0 64 64" style={{ filter: `blur(0.5px) drop-shadow(0 0 8px ${tier.color}40)` }}>
                            {/* Background ring */}
                            <circle
                              cx="32"
                              cy="32"
                              r="30"
                              fill="none"
                              stroke={`${tier.color}30`}
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                            
                            {/* Progress circle */}
                            {tierProgress > 0 && (
                              <circle
                                cx="32"
                                cy="32"
                                r="30"
                                stroke={tier.color}
                                strokeWidth="4"
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
                                src={padlockIcon} 
                                alt="Locked" 
                                className="w-6 h-6 opacity-60 drop-shadow-none"
                                style={{ filter: 'none', background: 'transparent' }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="text-base font-medium mb-1 text-black dark:text-white">
                          {tier.name}
                        </div>
                        <div className="text-base text-black dark:text-white">
                          {tier.minXP.toLocaleString()} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Ring Progression Section - Desktop */}
          {!isMobile && (
            <div className="px-0 pb-8">
              <div className="p-6">
                
                <div className="relative flex justify-between items-center gap-2">
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
                          <svg className={`w-28 h-28 transform -rotate-90 ${isNext && !isActive ? 'animate-pulse' : ''}`} viewBox="0 0 64 64" style={{ filter: `blur(0.5px) drop-shadow(0 0 10px ${tier.color}40)` }}>
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
                                   src={padlockIcon} 
                                   alt="Locked" 
                                   className="w-10 h-10 opacity-60 drop-shadow-none"
                                   style={{ filter: 'none', background: 'transparent' }}
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

          {/* Filter Buttons - Both Mobile and Desktop */}
          <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
            {isMobile ? (
              /* Mobile: Horizontal button layout like desktop */
              <div className="flex justify-center gap-1 flex-wrap">
                {[
                  { key: 'all' as const, label: 'All', icon: '🏆' },
                  { key: 'unlocked' as const, label: 'Unlocked', icon: '✅' },
                  { key: 'locked' as const, label: 'Locked', icon: '🔒' },
                  { key: 'exploration' as const, label: 'Exploration', icon: '🌍' },
                  { key: 'skill' as const, label: 'Skill', icon: '🎯' }
                ].map(({ key, label, icon }) => {
                  const count = getFilterCount(key);
                  return (
                    <Button
                      key={key}
                      variant={activeFilter === key ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(key)}
                      className={`gap-2 px-3 py-2 rounded-full transition-all duration-200 text-sm ${
                        activeFilter === key 
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' 
                          : ''
                      }`}
                    >
                      <span className="text-base">{icon}</span>
                      {label} ({count})
                    </Button>
                  );
                })}
              </div>
            ) : (
              /* Desktop: Horizontal button layout */
              <div className="flex justify-center gap-2 flex-wrap">
                {[
                  { key: 'all' as const, label: 'All', icon: '🏆' },
                  { key: 'unlocked' as const, label: 'Unlocked', icon: '✅' },
                  { key: 'locked' as const, label: 'Locked', icon: '🔒' },
                  { key: 'exploration' as const, label: 'Exploration', icon: '🌍' },
                  { key: 'skill' as const, label: 'Skill', icon: '🎯' }
                ].map(({ key, label, icon }) => {
                  const count = getFilterCount(key);
                  return (
                    <Button
                      key={key}
                      variant={activeFilter === key ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(key)}
                      className={`gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                        activeFilter === key 
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' 
                          : ''
                      }`}
                    >
                      <span>{icon}</span>
                      {label} ({count})
                    </Button>
                  );
                })}
              </div>
            )}
          </div>


          {/* Sticky Progress Header (Collapsed state) */}
          <div className={`sticky top-0 z-10 bg-card/95 backdrop-blur-sm transition-all duration-400 ease-in-out ${
            isCollapsed 
              ? isMobile ? 'px-4 py-2' : 'px-6 py-3' 
              : 'hidden'
          }`}>
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
                  {!isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleCollapse}
                      className="p-1 h-6 w-6"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
          </div>

          {/* Featured Most Recent Achievement */}
          {mostRecentAchievement && (
            <div className={`${isMobile ? 'px-4 pb-3' : 'px-6 pb-4'} flex justify-center`}>
              <div className="relative max-w-2xl">
                {/* Featured Achievement Card */}
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Large Badge without glow and title underneath */}
                    <div className="relative text-center">
                      <div style={{ filter: 'none', background: 'transparent' }}>
                        {getFeaturedAchievementIcon(mostRecentAchievement)}
                      </div>
                      
                      {/* Achievement Title under badge */}
                      <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-3 mb-1">
                        {mostRecentAchievement.title}
                      </h4>
                      
                      {/* XP below title in green */}
                      <div className="text-center">
                        <span className="text-green-500 font-bold text-lg">+{mostRecentAchievement.xp} XP</span>
                      </div>
                    </div>
                    
                    {/* Latest Achievement Details */}
                    <div className="flex-1">
                      <h3 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-black dark:text-white mb-3 mt-2`}>Latest Achievement</h3>
                      
                      <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        <span className="text-green-500 font-bold">+{mostRecentAchievement.xp} XP</span>
                      </div>
                      
                      {/* Share Button */}
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full flex items-center gap-2"
                        >
                          Share Achievement
                          <PaperAirplaneIcon className="!w-5 !h-5" />
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Unlocked {mostRecentAchievement.dateEarned}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Experience & Exploration Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
            <div className={`${isMobile ? 'px-0 pb-6' : 'px-6 pb-8'} ${isMobile ? 'pt-0' : '-mt-4'}`}>
              {/* Card Container with Visual Grouping */}
              <div className="p-6">
                {/* Section Header with Icon */}
                  <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                      Experience & Exploration Achievements
                    </h3>
                  </div>
                
                   <div className={`${isMobile ? 'grid grid-cols-3 gap-2 px-0' : 'grid grid-cols-4 gap-3'}`}>
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
                                 >
                                  {/* Icon directly on background - no container */}
                                   <div className="flex justify-center items-center relative">
                                     <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                                       {getAchievementIcon(achievement)}
                                     </div>
                                      {!achievement.isEarned && (
                                         <div className="absolute inset-0 flex items-center justify-center">
                                           <img 
                                             src={padlockIcon} 
                                             alt="Locked" 
                                              className={`${isMobile ? 'w-8 h-8' : 'w-14 h-14'} opacity-60 drop-shadow-none`}
                                             style={{ filter: 'none', background: 'transparent' }}
                                           />
                                        </div>
                                      )}
                                   </div>
                                  
                                  {/* Text stacked underneath */}
                                  <div className="text-center">
                                    <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
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

           {/* Skill & Performance Achievements Section */}
          {(activeFilter === 'all' || activeFilter === 'skill') && getFilteredAchievements(skillAchievements, 'skill').length > 0 && (
            <div className={`${isMobile ? 'px-0 pb-6' : 'px-6 pb-8'}`}>
              {/* Card Container with Visual Grouping */}
              <div className="p-6">
                {/* Section Header with Icon */}
                  <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                    <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                      Skill & Performance Achievements
                    </h3>
                  </div>
                
                  <div className={`${isMobile ? 'grid grid-cols-3 gap-2 px-0' : 'grid grid-cols-4 gap-3'}`}>
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
                                 >
                                  {/* Icon directly on background - no container */}
                                   <div className="flex justify-center items-center relative">
                                     <div className={`transition-all duration-200 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                                       {getAchievementIcon(achievement)}
                                     </div>
                                      {!achievement.isEarned && (
                                         <div className="absolute inset-0 flex items-center justify-center">
                                           <img 
                                             src={padlockIcon} 
                                             alt="Locked" 
                                             className={`${isMobile ? 'w-8 h-8' : 'w-14 h-14'} opacity-60 drop-shadow-none`}
                                             style={{ filter: 'none', background: 'transparent' }}
                                           />
                                        </div>
                                      )}
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

      </div>
      
      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        isOpen={showAchievementDetailModal}
        onClose={() => setShowAchievementDetailModal(false)}
        achievement={selectedAchievement}
      />

      {/* Scroll to top FAB */}
      <ScrollToTopGlass />
    </div>
  );
};

export default AchievementsPane;