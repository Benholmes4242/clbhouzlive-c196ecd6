// AchievementsTabContent - Achievement Tab Page Content (From Clubhouse Modal)
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
  console.log('AchievementsTabContent rendering - v2.0 (From Clubhouse Modal)');
  
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
    // Add a small delay to ensure the component is fully rendered
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
  }, [isManuallyCollapsed]);

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

  // Reset state when component mounts
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

  // EXPLORATION ACHIEVEMENTS (from original modal)
  const explorationAchievements: Achievement[] = [
    {
      title: "20 Club",
      emoji: "⭐",
      isEarned: true,
      description: "Play 20 different golf courses",
      xp: 200,
      isRepeatable: false,
      progress: "20/20",
      dateEarned: "2024-01-15"
    },
    {
      title: "50 Club",
      emoji: "🌟",
      isEarned: true,
      description: "Play 50 different golf courses",
      xp: 500,
      isRepeatable: false,
      progress: "50/50",
      dateEarned: "2024-02-20"
    },
    {
      title: "100 Century Club",
      emoji: "💎",
      isEarned: false,
      description: "Play 100 different golf courses",
      xp: 1000,
      isRepeatable: false,
      progress: "73/100",
      unlockHint: "Visit 27 more unique courses to unlock this prestigious achievement"
    },
    {
      title: "200 Clubhouse Elite",
      emoji: "👑",
      isEarned: false,
      description: "Play 200 different golf courses",
      xp: 2000,
      isRepeatable: false,
      progress: "73/200",
      unlockHint: "An elite milestone for the most dedicated course explorers"
    },
    {
      title: "300 Club Champion",
      emoji: "🏆",
      isEarned: false,
      description: "Play 300 different golf courses",
      xp: 3000,
      isRepeatable: false,
      progress: "73/300",
      unlockHint: "The ultimate explorer achievement - for true golf legends"
    },
    // Additional exploration achievements from original modal
    {
      title: "Top 100 Conqueror",
      emoji: "🏔️",
      isEarned: false,
      description: "Play 50 courses from the Top 100 in the World list",
      xp: 2500,
      isRepeatable: false,
      progress: "17/50",
      unlockHint: "Chase those bucket list courses - 33 more to conquer!"
    },
    {
      title: "Globetrotter Golfer",
      emoji: "🌍",
      isEarned: false,
      description: "Play golf on 5 different continents",
      xp: 3000,
      isRepeatable: false,
      progress: "3/5",
      unlockHint: "Two more continents to complete your global golf journey"
    },
    {
      title: "One Day, Two Courses",
      emoji: "⏰",
      isEarned: true,
      description: "Play two different courses in a single day",
      xp: 300,
      isRepeatable: false,
      dateEarned: "2024-03-10"
    },
    {
      title: "Marathon Golfer",
      emoji: "🏃‍♂️",
      isEarned: false,
      description: "Play 54 holes in a single day",
      xp: 500,
      isRepeatable: true,
      unlockHint: "Triple round day - the ultimate golf endurance test"
    },
    {
      title: "Regional Master",
      emoji: "🗺️",
      isEarned: false,
      description: "Play every course in a county/state (min. 10 courses)",
      xp: 1500,
      isRepeatable: true,
      progress: "8/12",
      unlockHint: "4 more courses to dominate your region"
    },
    {
      title: "International Golfer",
      emoji: "🛂",
      isEarned: true,
      description: "Play golf in 3 different countries",
      xp: 750,
      isRepeatable: false,
      dateEarned: "2024-04-05"
    },
    // Regional Flag Achievements
    {
      title: "Lynx Legend",
      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      isEarned: false,
      description: "Play 25 courses in Britain & Ireland",
      xp: 1200,
      isRepeatable: false,
      progress: "12/25",
      unlockHint: "Experience the home of golf - 13 more courses to go"
    },
    {
      title: "The Continental Swinger",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Play 25 courses across Continental Europe",
      xp: 1200,
      isRepeatable: false,
      progress: "7/25",
      unlockHint: "Explore Europe's finest golf - 18 more courses await"
    },
    {
      title: "Stars and Stripes Tourer",
      emoji: "🇺🇸",
      isEarned: true,
      description: "Play 25 courses in the United States",
      xp: 1200,
      isRepeatable: false,
      dateEarned: "2024-05-12"
    },
    {
      title: "Legends Club",
      emoji: "🏛️",
      isEarned: false,
      description: "Play the 'Big 4' major championship courses",
      xp: 2000,
      isRepeatable: false,
      progress: "2/4",
      unlockHint: "Augusta & St. Andrews await - complete the major slam"
    }
  ];

  // SKILL ACHIEVEMENTS (from original modal)
  const skillAchievements: Achievement[] = [
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: true,
      description: "Score your first eagle",
      xp: 100,
      isRepeatable: false,
      dateEarned: "2024-01-10"
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Score 10 eagles",
      xp: 500,
      isRepeatable: false,
      progress: "3/10",
      unlockHint: "Keep attacking those par 5s and long par 4s"
    },
    {
      title: "Hole-in-One",
      emoji: "⚡",
      isEarned: false,
      description: "Score a hole-in-one",
      xp: 1000,
      isRepeatable: true,
      unlockHint: "The golf holy grail - keep aiming for those pins!"
    },
    {
      title: "Albatross Ace",
      emoji: "🕊️",
      isEarned: false,
      description: "Score an albatross (double eagle)",
      xp: 2000,
      isRepeatable: true,
      unlockHint: "Extremely rare - usually on a par 5 with perfect conditions"
    },
    // Additional skill achievements from original modal
    {
      title: "Birdie Blitz",
      emoji: "🐦",
      isEarned: true,
      description: "Score 3+ birdies in a single round",
      xp: 200,
      isRepeatable: false,
      dateEarned: "2024-02-14"
    },
    {
      title: "Back-to-Back Birdies",
      emoji: "🐦🐦",
      isEarned: true,
      description: "Score birdies on consecutive holes",
      xp: 150,
      isRepeatable: false,
      dateEarned: "2024-01-28"
    },
    {
      title: "No Bogey Round",
      emoji: "✨",
      isEarned: false,
      description: "Complete a round without any bogeys",
      xp: 400,
      isRepeatable: false,
      unlockHint: "Consistency is key - avoid those big numbers"
    },
    {
      title: "Under Par Round",
      emoji: "📈",
      isEarned: false,
      description: "Shoot under par for 18 holes",
      xp: 600,
      isRepeatable: false,
      unlockHint: "The holy grail for amateur golfers"
    },
    {
      title: "Birdie Every Par",
      emoji: "🎯",
      isEarned: false,
      description: "Score a birdie on a par 3, 4, and 5 in one round",
      xp: 300,
      isRepeatable: false,
      unlockHint: "Attack all types of holes for the complete birdie set"
    },
    {
      title: "Par Machine",
      emoji: "⚙️",
      isEarned: false,
      description: "Score par or better on 15+ holes in a round",
      xp: 250,
      isRepeatable: false,
      progress: "13/15",
      unlockHint: "2 more solid holes for mechanical precision"
    },
    {
      title: "Single-Figure Handicap",
      emoji: "🔢",
      isEarned: false,
      description: "Achieve a handicap of 9 or lower",
      xp: 1000,
      isRepeatable: false,
      unlockHint: "The elite club - keep grinding to single figures"
    },
    {
      title: "Plus Handicap Player",
      emoji: "➕",
      isEarned: false,
      description: "Achieve a plus handicap (better than scratch)",
      xp: 2500,
      isRepeatable: false,
      unlockHint: "Professional level - the ultimate amateur achievement"
    },
    {
      title: "Club Loyalist",
      emoji: "🏡",
      isEarned: false,
      description: "Play 50 rounds at your home club",
      xp: 400,
      isRepeatable: false,
      progress: "23/50",
      unlockHint: "27 more rounds to show true club loyalty"
    }
  ];


  // Helper function to get achievement badge image (from original modal)
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
        return (
          <div className={`${isMobile ? "w-24 h-24 text-4xl" : "w-40 h-40 text-6xl"} flex items-center justify-center drop-shadow-lg`}>
            {achievement.emoji}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section with XP Progress */}
      <div className={`bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 transition-all duration-500 ease-in-out ${
        isCollapsed ? (isMobile ? 'pb-4' : 'pb-6') : (isMobile ? 'pb-8' : 'pb-12')
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          {/* Profile and XP Section */}
          <div className={`flex flex-col items-center transition-all duration-500 ease-in-out ${
            isCollapsed ? (isMobile ? 'pt-4' : 'pt-6') : (isMobile ? 'pt-8' : 'pt-12')
          }`}>
            {/* Profile Picture */}
            <div className={`relative mb-6 transition-all duration-500 ${isCollapsed ? 'scale-75 opacity-80' : 'scale-100'}`}>
              <div className="relative">
                <img
                  src={userProfilePhotoUrl || '/placeholder.svg'}
                  alt={userDisplayName}
                  className={`rounded-full object-cover border-4 border-white shadow-xl ${
                    isMobile ? 'w-24 h-24' : 'w-32 h-32'
                  }`}
                />
                {showCelebration && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-500/30 animate-pulse" />
                )}
              </div>
            </div>

            {/* User Info and XP */}
            <div className={`text-center transition-all duration-500 ${isCollapsed ? 'opacity-70 scale-95' : 'opacity-100'}`}>
              <h1 className={`font-bold text-foreground mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {userDisplayName}'s Achievements
              </h1>
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="text-center">
                  <div className={`font-bold text-primary ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    {totalXP.toLocaleString()} XP
                  </div>
                  <div className="text-sm text-muted-foreground">Current XP</div>
                </div>
                {nextTier && (
                  <div className="text-center">
                    <div className={`font-bold text-muted-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>
                      {nextTier.minXP.toLocaleString()} XP
                    </div>
                    <div className="text-sm text-muted-foreground">Next Tier</div>
                  </div>
                )}
              </div>
            </div>

            {/* XP Ring System */}
            <div className={`mb-6 transition-all duration-500 ${isCollapsed ? 'scale-75' : 'scale-100'}`}>
              <XPRingSystem
                currentXP={totalXP}
                size={isMobile ? "medium" : "large"}
              />
            </div>

            {/* Collapse Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCollapse}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Achievement Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { id: 'all', label: 'All', icon: Trophy },
              { id: 'unlocked', label: 'Unlocked', icon: Trophy },
              { id: 'locked', label: 'Locked', icon: Trophy },
              { id: 'exploration', label: 'Exploration', icon: Trophy },
              { id: 'skill', label: 'Skill', icon: Trophy }
            ].map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter.id as any)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement Content */}
      <div ref={scrollRef} className="max-w-6xl mx-auto px-4 py-6">
        {/* Exploration Achievements */}
        {(activeFilter === 'all' || activeFilter === 'exploration') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Trophy className="mr-2 h-6 w-6" />
              Exploration Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredAchievements(explorationAchievements, 'exploration').map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                    achievement.isEarned
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={achievement.isEarned ? '' : 'grayscale opacity-60'}>
                      {getAchievementIcon(achievement)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{achievement.xp} XP</span>
                    {achievement.progress && (
                      <span className="font-medium">{achievement.progress}</span>
                    )}
                  </div>
                  {achievement.dateEarned && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      Earned {new Date(achievement.dateEarned).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Achievements */}
        {(activeFilter === 'all' || activeFilter === 'skill') && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Sparkles className="mr-2 h-6 w-6" />
              Skill Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredAchievements(skillAchievements, 'skill').map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                    achievement.isEarned
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={achievement.isEarned ? '' : 'grayscale opacity-60'}>
                      {getAchievementIcon(achievement)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{achievement.xp} XP</span>
                    {achievement.progress && (
                      <span className="font-medium">{achievement.progress}</span>
                    )}
                  </div>
                  {achievement.dateEarned && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Earned {new Date(achievement.dateEarned).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
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

export default AchievementsTabContent;
