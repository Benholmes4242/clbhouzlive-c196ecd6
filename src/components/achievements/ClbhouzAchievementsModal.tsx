import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { XPRingSystem } from "@/components/profile/XPRingSystem";

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
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAllAchievements, setShowAllAchievements] = useState(true);
  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  
  // Find next milestone (this is simplified - you can enhance based on your XP system)
  const nextMilestone = 5000;
  // XP Ring level will be calculated by the XP Ring System component

  // Helper function to get achievement badge image
  const getAchievementIcon = (achievement: Achievement) => {
    // Use custom badges for specific achievements regardless of earned status
    switch (achievement.title) {
      case "20 Club":
        return <img src="/lovable-uploads/a33df9b4-0089-43ca-913d-132fc5b11cc3.png" alt="20 Club Badge" className="w-32 h-32" />;
      case "50 Club":
        return <img src="/lovable-uploads/c1ba04e8-7aed-40e6-948b-0b65fdc932b2.png" alt="50 Club Badge" className="w-32 h-32" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/91e26115-098d-4b21-9b29-7e1800fe52bd.png" alt="100 Century Club Badge" className="w-32 h-32" />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/b566e805-826b-4005-b9d1-c5bdc87786b1.png" alt="200 Clubhouse Elite Badge" className="w-32 h-32" />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/03c915d7-c037-4b15-92c3-745a709da230.png" alt="300 Club Champion Badge" className="w-32 h-32" />;
      case "European Explorer":
        return <img src="/lovable-uploads/24422ab1-3322-4f51-801b-8ae8e80c95d7.png" alt="European Explorer Badge" className="w-24 h-24" />;
      case "UK & Ireland Explorer":
        return <img src="/lovable-uploads/54fecf12-83df-48be-b433-d227be70278d.png" alt="UK & Ireland Explorer Badge" className="w-24 h-24" />;
      case "USA Explorer":
        return <img src="/lovable-uploads/ad7f9c0b-b395-4b96-b059-63ebab11bd4f.png" alt="USA Explorer Badge" className="w-24 h-24" />;
      case "World Explorer":
        return <img src="/lovable-uploads/5b02f0bf-9891-4439-971c-4d3cb7a37355.png" alt="World Explorer Badge" className="w-24 h-24" />;
      default:
        // For other achievements, show emoji if earned, lock if not
        return achievement.isEarned ? achievement.emoji : '🔒';
    }
  };

  // Skill & Performance Achievements
  const skillAchievements: Achievement[] = [
    {
      title: "Single-Figure Handicap",
      emoji: "🏆",
      isEarned: false,
      description: "Achieve a single-digit handicap (0-9). A mark of consistent, skilled play.",
      xp: 250,
      isRepeatable: false,
      progress: "Current: 12.3"
    },
    {
      title: "Plus Handicap Player",
      emoji: "⭐",
      isEarned: false,
      description: "Reach plus handicap status. Elite level golf achievement.",
      xp: 500,
      isRepeatable: false,
      progress: "Target: +0.0"
    },
    {
      title: "Personal Best Round",
      emoji: "📈",
      isEarned: true,
      description: "Shoot your lowest score ever. Keep pushing your limits!",
      xp: 100,
      isRepeatable: true,
      progress: "Best: 78"
    },
    {
      title: "Under Par Round",
      emoji: "🎯",
      isEarned: true,
      description: "Complete a round under par. Exceptional performance!",
      xp: 150,
      isRepeatable: true,
      progress: "Achieved: 2 times"
    },
    {
      title: "First Eagle",
      emoji: "🦅",
      isEarned: true,
      description: "Score your first eagle (2 under par). A memorable milestone!",
      xp: 100,
      isRepeatable: false,
      progress: "Completed"
    },
    {
      title: "Birdie Blitz",
      emoji: "🐦",
      isEarned: false,
      description: "Score 3 or more birdies in a single round. On fire!",
      xp: 75,
      isRepeatable: true,
      progress: "Best: 2 birdies"
    },
    {
      title: "Eagle Collector",
      emoji: "🦅",
      isEarned: false,
      description: "Accumulate 5 total eagles throughout your golf journey.",
      xp: 250,
      isRepeatable: false,
      progress: "2 / 5 eagles"
    },
    {
      title: "Hole-in-One",
      emoji: "🕳️",
      isEarned: false,
      description: "The ultimate golf achievement - ace a hole! Each one counts.",
      xp: 500,
      isRepeatable: true,
      progress: "0 aces"
    },
    {
      title: "Back-to-Back Birdies",
      emoji: "🎪",
      isEarned: false,
      description: "Score consecutive birdies. Momentum is everything!",
      xp: 100,
      isRepeatable: false,
      progress: "Not achieved"
    },
    {
      title: "No Bogey Round",
      emoji: "💯",
      isEarned: false,
      description: "Complete a round without any bogeys. Consistency at its finest.",
      xp: 200,
      isRepeatable: false,
      progress: "Best: 2 bogeys"
    },
    {
      title: "Top 100 Conqueror",
      emoji: "🌟",
      isEarned: false,
      description: "Play 10 of the world's Top 100 golf courses. Elite course collection!",
      xp: 400,
      isRepeatable: false,
      progress: "3 / 10 courses"
    },
    {
      title: "Regional Master",
      emoji: "🗺️",
      isEarned: false,
      description: "Complete all courses in a selected region. Local expertise achieved!",
      xp: 300,
      isRepeatable: false,
      progress: "Scotland: 8/12"
    },
    {
      title: "International Golfer",
      emoji: "✈️",
      isEarned: true,
      description: "Play golf in 3 or more countries. Global golf adventurer!",
      xp: 150,
      isRepeatable: false,
      progress: "4 countries"
    },
    {
      title: "Sunrise to Sunset",
      emoji: "☀️",
      isEarned: false,
      description: "Play 2 rounds in a single day. True dedication to the game!",
      xp: 125,
      isRepeatable: true,
      progress: "Not achieved"
    },
    {
      title: "Club Loyalist",
      emoji: "🏠",
      isEarned: false,
      description: "Play 50 rounds at your home club. True club spirit and loyalty!",
      xp: 350,
      isRepeatable: false,
      progress: "23 / 50 rounds"
    }
  ];

  // Experience & Exploration Achievements
  const explorationAchievements: Achievement[] = [
    // Top 100 Courses Played
    {
      title: "20 Club",
      emoji: "🥉",
      isEarned: false,
      description: "Play 20 Top 100 Courses. Beginning your journey through golf's elite venues.",
      xp: 200,
      isRepeatable: false,
      progress: "3 / 20 courses"
    },
    {
      title: "50 Club",
      emoji: "🥈",
      isEarned: false,
      description: "Play 50 Top 100 Courses. Serious commitment to experiencing golf's finest.",
      xp: 500,
      isRepeatable: false,
      progress: "3 / 50 courses"
    },
    {
      title: "100 Century Club",
      emoji: "🥇",
      isEarned: false,
      description: "Play 100 Top 100 Courses. A monumental achievement in golf exploration.",
      xp: 1000,
      isRepeatable: false,
      progress: "3 / 100 courses"
    },
    {
      title: "200 Clubhouse Elite",
      emoji: "💎",
      isEarned: false,
      description: "Play 200 Top Golf Courses. Among the world's most accomplished golfers.",
      xp: 1500,
      isRepeatable: false,
      progress: "3 / 200 courses"
    },
    {
      title: "300 Club Champion",
      emoji: "👑",
      isEarned: false,
      description: "Play 300 Top Courses Worldwide. Ultimate golf exploration mastery.",
      xp: 2000,
      isRepeatable: false,
      progress: "3 / 300 courses"
    },
    {
      title: "European Explorer",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Play courses across 5 different European countries",
      xp: 2500,
      isRepeatable: false,
      progress: "2 / 5 countries"
    },
    {
      title: "UK & Ireland Explorer",
      emoji: "🇬🇧",
      isEarned: true,
      description: "Play courses in both the UK and Ireland",
      xp: 2000,
      isRepeatable: false,
      progress: "2 / 2 countries"
    },
    {
      title: "USA Explorer",
      emoji: "🇺🇸",
      isEarned: false,
      description: "Play courses across 10 different US states",
      xp: 3000,
      isRepeatable: false,
      progress: "1 / 10 states"
    },
    {
      title: "World Explorer",
      emoji: "🌍",
      isEarned: false,
      description: "Play courses on 4 different continents",
      xp: 5000,
      isRepeatable: false,
      progress: "1 / 4 continents"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {isCurrentUser ? "Your clbhouz achievements" : `${userDisplayName}'s clbhouz achievements`}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            See how far your game can take you
          </p>
        </DialogHeader>
        
        <div 
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
          style={{ 
            scrollbarWidth: 'thin',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* User Profile Section */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                {userProfilePhotoUrl ? (
                  <img 
                    src={userProfilePhotoUrl} 
                    alt={`${userDisplayName}'s profile`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-semibold">{userDisplayName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{userDisplayName}</h3>
                  <p className="text-sm text-muted-foreground">
                     {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'}
                   </p>
                </div>
              </div>
              <div className="flex rounded-full border border-border bg-background p-1">
                <button
                  onClick={() => setShowAllAchievements(true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    showAllAchievements 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  See All
                </button>
                <button
                  onClick={() => setShowAllAchievements(false)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    !showAllAchievements 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  See Unlocked
                </button>
              </div>
            </div>
          </div>

          {/* Progress Ring Section */}
          <div className="px-6 pb-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              {/* Current Progress XP - Top Right */}
              <div className="flex justify-end mb-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {totalXP.toLocaleString()} XP
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current Progress
                  </div>
                </div>
              </div>
              
              {/* Progress Ring and Info - Centered as a unit */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-12">
                  {/* Progress Ring - Left */}
                  <div className="relative flex-shrink-0">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-300 dark:text-gray-600"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          stroke="#4682B4"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${54 * 2 * Math.PI}`}
                          strokeDashoffset={`${54 * 2 * Math.PI * (1 - (totalXP / 10000))}`}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-in-out"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(70, 130, 180, 0.4))'
                          }}
                        />
                      </svg>
                      {/* Center XP to next ring */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-lg font-bold text-foreground">
                          {(10000 - totalXP).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          XP to next ring
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ring Info - Right */}
                  <div className="w-64">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-500">
                        No Ring Achieved
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Reach 10,000 XP to unlock your first ring
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        Next: Blue Ring at 10,000 XP
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Rings Display */}
              <div className="w-full mt-6">
                <div className="flex justify-between items-start gap-2">
                  {[
                    { name: "Blue Ring", color: "#4682B4", minXP: 10000, maxXP: 19999 },
                    { name: "Green Ring", color: "#6e9277", minXP: 20000, maxXP: 29999 },
                    { name: "Silver Ring", color: "#C0C0C0", minXP: 30000, maxXP: 39999 },
                    { name: "Gold Ring", color: "#FFD700", minXP: 40000, maxXP: 49999 }
                  ].map((tier) => {
                    const isActive = totalXP >= tier.minXP;
                    
                    return (
                        <div key={tier.name} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all mb-2 ${
                              isActive ? 'opacity-100' : 'opacity-80'
                            }`}
                            style={{
                              borderColor: tier.color,
                              backgroundColor: isActive ? tier.color + '50' : tier.color + '20'
                            }}
                            title={`${tier.name}: ${tier.minXP.toLocaleString()} - ${tier.maxXP.toLocaleString()} XP`}
                          />
                        
                        <div className="text-center">
                          <h4 className="font-semibold text-xs" style={{ color: isActive ? tier.color : '#9CA3AF' }}>
                            {tier.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tier.minXP.toLocaleString()}-{tier.maxXP.toLocaleString()} XP
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Exploration Achievements */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Experience & Exploration Achievements</h3>
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {explorationAchievements
                  .filter(achievement => showAllAchievements || achievement.isEarned)
                  .map((achievement) => (
                  <Tooltip key={achievement.title}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          border rounded-lg p-4 transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-3
                          ${achievement.isEarned 
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                            : 'bg-background border-border'
                          }
                        `}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <div className="flex-shrink-0">
                          {getAchievementIcon(achievement)}
                        </div>
                        <div className="flex-1 text-center">
                          <h4 className="font-medium text-sm mb-1">
                            {achievement.title}
                          </h4>
                          <p className={`text-xs ${achievement.isEarned ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                            +{achievement.xp} XP {achievement.isRepeatable ? "(R)" : ""}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="text-center">
                        <h4 className="font-semibold mb-1">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs font-medium mb-1">
                          +{achievement.xp} XP {achievement.isRepeatable ? "(Repeatable)" : "(One-time)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Progress: {achievement.progress}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Skill & Performance Achievements */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Skill & Performance Achievements</h3>
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {skillAchievements
                  .filter(achievement => showAllAchievements || achievement.isEarned)
                  .map((achievement) => (
                  <Tooltip key={achievement.title}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          border rounded-lg p-4 transition-all duration-200 hover:scale-105 cursor-pointer flex items-center gap-3
                          ${achievement.isEarned 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                            : 'bg-background border-border'
                          }
                        `}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <div className="flex-shrink-0">
                          {getAchievementIcon(achievement)}
                        </div>
                        <div className="flex-1 text-center">
                          <h4 className="font-medium text-sm mb-1">
                            {achievement.title}
                          </h4>
                          <p className={`text-xs ${achievement.isEarned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            +{achievement.xp} XP {achievement.isRepeatable ? "(R)" : ""}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="text-center">
                        <h4 className="font-semibold mb-1">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs font-medium mb-1">
                          +{achievement.xp} XP {achievement.isRepeatable ? "(Repeatable)" : "(One-time)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Progress: {achievement.progress}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

        </div>

        {/* Mobile Achievement Details Dialog */}
        {selectedAchievement && (
          <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className="text-center flex items-center justify-center gap-2">
                  <span className="text-2xl flex items-center">
                    {getAchievementIcon(selectedAchievement)}
                  </span>
                  {selectedAchievement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedAchievement.description}
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    +{selectedAchievement.xp} XP {selectedAchievement.isRepeatable ? "(Repeatable)" : "(One-time)"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Progress: {selectedAchievement.progress}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;