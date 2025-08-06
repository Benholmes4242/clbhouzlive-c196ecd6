import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { XPRingSystem } from "@/components/profile/XPRingSystem";

interface ClbhouzAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userDisplayName?: string;
  userHandicap?: string | number;
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
  userHandicap
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  
  // Find next milestone (this is simplified - you can enhance based on your XP system)
  const nextMilestone = 5000;
  // XP Ring level will be calculated by the XP Ring System component

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
    // Regional Top 100 Achievements
    {
      title: "GB & Ireland Top 100",
      emoji: "🇬🇧",
      isEarned: false,
      description: "Complete all GB & Ireland Top 100 courses. Master the home of golf.",
      xp: 750,
      isRepeatable: false,
      progress: "8 / 50 courses"
    },
    {
      title: "Continental Europe Top 100",
      emoji: "🇪🇺",
      isEarned: false,
      description: "Complete all Continental Europe Top 100 courses. European golf excellence.",
      xp: 750,
      isRepeatable: false,
      progress: "2 / 30 courses"
    },
    {
      title: "USA Top 100",
      emoji: "🇺🇸",
      isEarned: false,
      description: "Complete all USA Top 100 courses. American golf at its finest.",
      xp: 1000,
      isRepeatable: false,
      progress: "0 / 50 courses"
    },
    {
      title: "Worldwide Top 100",
      emoji: "🌍",
      isEarned: false,
      description: "Complete all Global Top 100 courses. The ultimate golf pilgrimage.",
      xp: 2500,
      isRepeatable: false,
      progress: "3 / 100 courses"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">Clbhouz Achievements Tray</DialogTitle>
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
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">{userDisplayName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{userDisplayName}</h3>
                  <p className="text-sm text-muted-foreground">
                     {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'}
                   </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                See All
              </Button>
            </div>
          </div>

          {/* XP Ring System Section */}
          <div className="px-6 pb-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <XPRingSystem 
                currentXP={totalXP} 
                size="large"
                showMiniRings={true}
                className="w-full"
              />
            </div>
          </div>

          {/* Skill & Performance Achievements */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Skill & Performance Achievements</h3>
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {skillAchievements.map((achievement) => (
                  <Tooltip key={achievement.title}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          border rounded-lg p-4 text-center transition-all duration-200 hover:scale-105 cursor-pointer
                          ${achievement.isEarned 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                            : 'bg-muted/30 border-border opacity-70'
                          }
                        `}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <div className="text-2xl mb-2">
                          {achievement.isEarned ? achievement.emoji : '🔒'}
                        </div>
                        <h4 className="font-medium text-sm mb-1">
                          {achievement.title}
                        </h4>
                        <p className={`text-xs ${achievement.isEarned ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          +{achievement.xp} XP {achievement.isRepeatable ? "(R)" : ""}
                        </p>
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

          {/* Experience & Exploration Achievements */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Experience & Exploration Achievements</h3>
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {explorationAchievements.map((achievement) => (
                  <Tooltip key={achievement.title}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          border rounded-lg p-4 text-center transition-all duration-200 hover:scale-105 cursor-pointer
                          ${achievement.isEarned 
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                            : 'bg-muted/30 border-border opacity-70'
                          }
                        `}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <div className="text-2xl mb-2">
                          {achievement.isEarned ? achievement.emoji : '🔒'}
                        </div>
                        <h4 className="font-medium text-sm mb-1">
                          {achievement.title}
                        </h4>
                        <p className={`text-xs ${achievement.isEarned ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                          +{achievement.xp} XP {achievement.isRepeatable ? "(R)" : ""}
                        </p>
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
                  <span className="text-2xl">
                    {selectedAchievement.isEarned ? selectedAchievement.emoji : '🔒'}
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