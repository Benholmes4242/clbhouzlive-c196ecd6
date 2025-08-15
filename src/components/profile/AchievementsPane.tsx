// AchievementsPane - Complete inline achievements for Profile page
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ChevronDown, ChevronUp, Lock, Share2 } from "lucide-react";
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
  
  // XP Ring Tier System 
  const xpRings = [
    { name: "Blue Ring", color: "#4682B4", minXP: 10000, maxXP: 19999, ringGradient: "conic-gradient(from 0deg, #4682B4, #5F9EA0, #4682B4)" },
    { name: "Green Ring", color: "#6e9277", minXP: 20000, maxXP: 29999, ringGradient: "conic-gradient(from 0deg, #6e9277, #8bb485, #6e9277)" },
    { name: "Silver Ring", color: "#C0C0C0", minXP: 30000, maxXP: 39999, ringGradient: "conic-gradient(from 0deg, #C0C0C0, #E5E5E5, #C0C0C0)" },
    { name: "Gold Ring", color: "#FFD700", minXP: 40000, maxXP: 49999, ringGradient: "conic-gradient(from 0deg, #FFD700, #FFA500, #FFD700)" }
  ];
  
  const currentTier = xpRings.slice().reverse().find(tier => totalXP >= tier.minXP);
  const nextTier = xpRings.find(tier => totalXP < tier.minXP) || xpRings[xpRings.length - 1];

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
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className="w-20 h-20" />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className="w-20 h-20" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className="w-20 h-20" />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/88ba82c3-999c-40b9-885e-313869a7e795.png" alt="200 Clubhouse Elite Badge" className="w-20 h-20" />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/0088ccbe-6198-4f2c-ada2-e2bf642abec3.png" alt="300 Club Champion Badge" className="w-20 h-20" />;
      case "Eagle Collector":
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className="w-20 h-20" />;
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className="w-20 h-20" />;
      case "Birdie Every Par":
        return <img src="/lovable-uploads/164a0671-f0ff-4f1e-8780-4bba8a8fe7f4.png" alt="Birdie Every Par Badge" className="w-20 h-20" />;
      case "One Day, Two Courses":
        return <img src="/lovable-uploads/f8900d31-7d35-4e4e-9352-99f6198da121.png" alt="One Day Two Courses Badge" className="w-20 h-20" />;
      case "Globetrotter Golfer":
        return <img src="/lovable-uploads/684002ed-a5a9-46e9-a1fc-384da5a7c686.png" alt="Globetrotter Golfer Badge" className="w-20 h-20" />;
      case "Marathon Golfer":
        return <img src="/lovable-uploads/02a84f2b-af4f-4064-a7d6-bdd88575b69e.png" alt="Marathon Golfer Badge" className="w-20 h-20" />;
      case "Single-Figure Handicap":
        return <img src="/lovable-uploads/066c5dd6-9e79-49f2-8e4b-935a5242850a.png" alt="Single-Figure Handicap Badge" className="w-20 h-20" />;
      case "Plus Handicap Player":
        return <img src="/lovable-uploads/1779738a-184b-4a0d-85d0-b964641019d9.png" alt="Plus Handicap Player Badge" className="w-20 h-20" />;
      case "Under Par Round":
        return <img src="/lovable-uploads/d7d44dea-f5cc-416d-9a01-985d48262fc6.png" alt="Under Par Round Badge" className="w-20 h-20" />;
      case "First Eagle":
        return <img src="/lovable-uploads/6b62e9b3-33d7-4825-b1d7-aac6f86e4ad7.png" alt="First Eagle Badge" className="w-20 h-20" />;
      case "Hole-in-One":
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className="w-20 h-20" />;
      case "Back-to-Back Birdies":
        return <img src="/lovable-uploads/7e98fdc5-ab55-44e0-87ec-8b93e493b7e4.png" alt="Back-to-Back Birdies Badge" className="w-20 h-20" />;
      case "No Bogey Round":
        return <img src="/lovable-uploads/1a37c1e5-56c0-4e02-a95a-cbfa8ce3a1b6.png" alt="No Bogey Round Badge" className="w-20 h-20" />;
      case "Par Machine":
        return <img src="/lovable-uploads/51973f3e-599d-4110-bcf6-8eac43b963f8.png" alt="Par Machine Badge" className="w-20 h-20" />;
      case "International Golfer":
        return <img src="/lovable-uploads/3c0146da-b965-42cc-b130-ef9c25727aad.png" alt="International Golfer Badge" className="w-20 h-20" />;
      // Regional achievement badges
      case "Great Britain & Ireland":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className="w-20 h-20 rounded-lg" />;
      case "Continental Europe":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Europe Badge" className="w-20 h-20 rounded-lg" />;
      case "USA":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className="w-20 h-20 rounded-lg" />;
      case "Worldwide":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Worldwide Badge" className="w-20 h-20 rounded-lg" />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className="w-20 h-20" />;
      default:
        return (
          <div className="w-20 h-20 text-4xl flex items-center justify-center drop-shadow-lg">
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
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/88ba82c3-999c-40b9-885e-313869a7e795.png" alt="200 Clubhouse Elite Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/0088ccbe-6198-4f2c-ada2-e2bf642abec3.png" alt="300 Club Champion Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Eagle Collector":
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Birdie Every Par":
        return <img src="/lovable-uploads/164a0671-f0ff-4f1e-8780-4bba8a8fe7f4.png" alt="Birdie Every Par Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "One Day, Two Courses":
        return <img src="/lovable-uploads/f8900d31-7d35-4e4e-9352-99f6198da121.png" alt="One Day Two Courses Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Globetrotter Golfer":
        return <img src="/lovable-uploads/684002ed-a5a9-46e9-a1fc-384da5a7c686.png" alt="Globetrotter Golfer Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Marathon Golfer":
        return <img src="/lovable-uploads/02a84f2b-af4f-4064-a7d6-bdd88575b69e.png" alt="Marathon Golfer Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Single-Figure Handicap":
        return <img src="/lovable-uploads/066c5dd6-9e79-49f2-8e4b-935a5242850a.png" alt="Single-Figure Handicap Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Plus Handicap Player":
        return <img src="/lovable-uploads/1779738a-184b-4a0d-85d0-b964641019d9.png" alt="Plus Handicap Player Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Under Par Round":
        return <img src="/lovable-uploads/d7d44dea-f5cc-416d-9a01-985d48262fc6.png" alt="Under Par Round Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "First Eagle":
        return <img src="/lovable-uploads/6b62e9b3-33d7-4825-b1d7-aac6f86e4ad7.png" alt="First Eagle Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Hole-in-One":
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Back-to-Back Birdies":
        return <img src="/lovable-uploads/7e98fdc5-ab55-44e0-87ec-8b93e493b7e4.png" alt="Back-to-Back Birdies Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "No Bogey Round":
        return <img src="/lovable-uploads/1a37c1e5-56c0-4e02-a95a-cbfa8ce3a1b6.png" alt="No Bogey Round Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "Par Machine":
        return <img src="/lovable-uploads/51973f3e-599d-4110-bcf6-8eac43b963f8.png" alt="Par Machine Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      case "International Golfer":
        return <img src="/lovable-uploads/3c0146da-b965-42cc-b130-ef9c25727aad.png" alt="International Golfer Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      // Regional achievement badges with flag images
      case "Great Britain & Ireland":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-32 h-32 rounded-lg"} />;
      case "Continental Europe":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Europe Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-32 h-32 rounded-lg"} />;
      case "USA":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className={isMobile ? "w-24 h-24 rounded-lg" : "w-32 h-32 rounded-lg"} />;
      case "Worldwide":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Worldwide Badge" className={isMobile ? "w-24 h-24 rounded-lg" : "w-32 h-32 rounded-lg"} />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className={isMobile ? "w-24 h-24" : "w-32 h-32"} />;
      default:
        return (
          <div className={`${isMobile ? 'w-24 h-24 text-4xl' : 'w-32 h-32 text-6xl'} flex items-center justify-center drop-shadow-lg`}>
            {achievement.emoji}
          </div>
        );
    }
  };

  // Sample achievements data
  const explorationAchievements: Achievement[] = [
    { title: "20 Club", emoji: "🏌️", isEarned: true, description: "Complete 20 golf courses", xp: 200, isRepeatable: false, progress: "20/20", dateEarned: "2024-01-15" },
    { title: "50 Club", emoji: "⭐", isEarned: true, description: "Complete 50 golf courses", xp: 500, isRepeatable: false, progress: "50/50", dateEarned: "2024-02-20" },
    { title: "100 Century Club", emoji: "💯", isEarned: false, description: "Complete 100 golf courses", xp: 1000, isRepeatable: false, progress: "67/100" },
    { title: "200 Clubhouse Elite", emoji: "🏆", isEarned: false, description: "Complete 200 golf courses", xp: 2000, isRepeatable: false, progress: "67/200" },
    { title: "300 Club Champion", emoji: "👑", isEarned: false, description: "Complete 300 golf courses", xp: 3000, isRepeatable: false, progress: "67/300" },
    { title: "Great Britain & Ireland", emoji: "🇬🇧", isEarned: true, description: "Play 10 courses in Great Britain & Ireland", xp: 300, isRepeatable: false, progress: "10/10", dateEarned: "2024-03-10" },
    { title: "Continental Europe", emoji: "🇪🇺", isEarned: false, description: "Play 10 courses in Continental Europe", xp: 300, isRepeatable: false, progress: "3/10" },
    { title: "USA", emoji: "🇺🇸", isEarned: false, description: "Play 10 courses in the USA", xp: 300, isRepeatable: false, progress: "1/10" },
    { title: "Worldwide", emoji: "🌍", isEarned: false, description: "Play courses on 4 different continents", xp: 500, isRepeatable: false, progress: "2/4" },
    { title: "One Day, Two Courses", emoji: "⛳", isEarned: false, description: "Play two different courses in one day", xp: 150, isRepeatable: true, progress: "0/2" },
    { title: "Globetrotter Golfer", emoji: "✈️", isEarned: false, description: "Play courses in 10 different countries", xp: 750, isRepeatable: false, progress: "4/10" },
    { title: "Marathon Golfer", emoji: "🏃", isEarned: false, description: "Play 36 holes in a single day", xp: 200, isRepeatable: true, progress: "18/36" }
  ];

  const skillAchievements: Achievement[] = [
    { title: "First Eagle", emoji: "🦅", isEarned: true, description: "Score your first eagle", xp: 100, isRepeatable: false, dateEarned: "2024-01-20" },
    { title: "Eagle Collector", emoji: "🎯", isEarned: false, description: "Score 5 eagles total", xp: 250, isRepeatable: false, progress: "2/5" },
    { title: "Birdie Blitz", emoji: "🐦", isEarned: false, description: "Score 3 birdies in one round", xp: 150, isRepeatable: true, progress: "2/3" },
    { title: "Birdie Every Par", emoji: "🎪", isEarned: false, description: "Score a birdie on a par 3, 4, and 5 in one round", xp: 200, isRepeatable: true, progress: "2/3" },
    { title: "Hole-in-One", emoji: "🕳️", isEarned: false, description: "Score a hole-in-one", xp: 500, isRepeatable: true, progress: "0/1" },
    { title: "Back-to-Back Birdies", emoji: "🔄", isEarned: false, description: "Score birdies on consecutive holes", xp: 100, isRepeatable: true, progress: "0/2" },
    { title: "No Bogey Round", emoji: "✨", isEarned: false, description: "Complete a round without any bogeys", xp: 300, isRepeatable: true },
    { title: "Under Par Round", emoji: "📉", isEarned: false, description: "Complete a round under par", xp: 250, isRepeatable: true },
    { title: "Par Machine", emoji: "⚙️", isEarned: false, description: "Make par on 15+ holes in one round", xp: 150, isRepeatable: true, progress: "12/15" },
    { title: "Single-Figure Handicap", emoji: "📊", isEarned: false, description: "Achieve a handicap below 10", xp: 400, isRepeatable: false },
    { title: "Plus Handicap Player", emoji: "➕", isEarned: false, description: "Achieve a plus handicap", xp: 1000, isRepeatable: false },
    { title: "Albatross Ace", emoji: "🦅", isEarned: false, description: "Score an albatross (3 under par)", xp: 750, isRepeatable: true, progress: "0/1" }
  ];

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="relative p-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <h2 className={`font-bold text-gray-800 dark:text-gray-200 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            Achievements
          </h2>
        </div>
      </div>
      
      <div className="w-full" style={{ paddingTop: isMobile ? '20px' : '30px', paddingBottom: isMobile ? '130px' : '60px' }}>

        {/* Ring Progression Row - Full Width Like Badges */}
        <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
          <div className="p-6">
            <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200 text-center mb-6`}>
              Ring Progression
            </h3>
            
            {/* Ring Track with Connection Line */}
            <div className="relative flex justify-center">
              <div className="flex items-center gap-6 max-w-4xl w-full">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600 -translate-y-1/2 z-0"></div>
                
                {xpRings.map((ring, index) => {
                  const isUnlocked = totalXP >= ring.minXP;
                  const isNext = !isUnlocked && (index === 0 || totalXP >= xpRings[index - 1].minXP);
                  
                  return (
                    <div key={ring.name} className="flex-1 flex flex-col items-center relative z-10">
                      {/* Ring */}
                      <div 
                        className={`
                          relative w-16 h-16 rounded-full border-4 transition-all duration-300 cursor-pointer
                          ${isUnlocked 
                            ? 'border-transparent bg-white shadow-lg hover:scale-110' 
                            : isNext
                              ? 'border-gray-400 bg-gray-100 shadow-md hover:scale-105 ring-2 ring-blue-400 ring-opacity-50'
                              : 'border-gray-300 bg-gray-50 opacity-60 hover:scale-105'
                          }
                        `}
                        style={{
                          background: isUnlocked ? ring.ringGradient : undefined,
                        }}
                        onClick={() => {
                          // Handle ring click for details
                        }}
                      >
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      {/* Ring Label */}
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${isUnlocked ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'}`}>
                          {ring.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ring.minXP.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { key: 'all', label: 'All', count: explorationAchievements.length + skillAchievements.length },
              { key: 'unlocked', label: 'Unlocked', count: [...explorationAchievements, ...skillAchievements].filter(a => a.isEarned).length },
              { key: 'locked', label: 'Locked', count: [...explorationAchievements, ...skillAchievements].filter(a => !a.isEarned).length },
              { key: 'exploration', label: 'Exploration', count: explorationAchievements.length },
              { key: 'skill', label: 'Skill', count: skillAchievements.length }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key as any)}
                className={`
                  transition-all duration-200 hover:scale-105
                  ${activeFilter === filter.key 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Latest Achievement Section */}
        {getMostRecentAchievement() && (
          <div className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-6">
                {/* Achievement Badge */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20">
                    {getFeaturedAchievementIcon(getMostRecentAchievement()!)}
                  </div>
                </div>
                
                {/* Achievement Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      Latest Achievement
                    </h4>
                  </div>
                  <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {getMostRecentAchievement()!.title}
                  </p>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                    +{getMostRecentAchievement()!.xp} XP
                  </p>
                  <p className="text-sm text-gray-500">
                    Unlocked {new Date(getMostRecentAchievement()!.dateEarned!).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Share Button */}
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Achievement
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Exploration Achievements Section */}
        {(activeFilter === 'all' || activeFilter === 'exploration') && getFilteredAchievements(explorationAchievements, 'exploration').length > 0 && (
          <div className={`${isMobile ? 'px-0 pb-6' : 'px-6 pb-8'}`}>
            {/* Card Container with Visual Grouping */}
            <div className="p-6">
              {/* Section Header with Icon */}
                <div className={`flex items-center justify-center gap-3 ${isMobile ? 'mb-3' : 'mb-6'}`}>
                  <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-800 dark:text-gray-200`}>
                    Exploration Achievements
                  </h3>
                </div>
              
                <div className={`${isMobile ? 'grid grid-cols-3 gap-3 px-0' : 'grid grid-cols-4 gap-4'}`}>
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
                                  <div className={`transition-all duration-200 hover:scale-105 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                                    {getAchievementIcon(achievement)}
                                  </div>
                                  {/* Lock icon overlay for locked badges */}
                                  {!achievement.isEarned && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-full p-1">
                                        <Lock className="w-4 h-4 text-gray-500" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Text stacked underneath */}
                                <div className="text-center">
                                  <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                                    {achievement.title.toUpperCase()}
                                  </h4>
                                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-green-600 dark:text-green-400`}>
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
              
                <div className={`${isMobile ? 'grid grid-cols-3 gap-3 px-0' : 'grid grid-cols-4 gap-4'}`}>
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
                                  <div className={`transition-all duration-200 hover:scale-105 ${achievement.isEarned ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
                                    {getAchievementIcon(achievement)}
                                  </div>
                                  {/* Lock icon overlay for locked badges */}
                                  {!achievement.isEarned && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-full p-1">
                                        <Lock className="w-4 h-4 text-gray-500" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Text stacked underneath */}
                                <div className="text-center">
                                  <h4 className={`font-semibold mb-1 ${isMobile ? 'text-xs leading-tight' : 'text-sm'} ${achievement.isEarned ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}`}>
                                    {achievement.title.toUpperCase()}
                                  </h4>
                                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-green-600 dark:text-green-400`}>
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