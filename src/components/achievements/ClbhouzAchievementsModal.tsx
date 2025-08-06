import React from 'react';
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
  // Mock data for now - replace with actual badge system later
  const totalXP = 2500;
  
  // Find next milestone (this is simplified - you can enhance based on your XP system)
  const nextMilestone = 5000;
  // XP Ring level will be calculated by the XP Ring System component

  // Real achievements data
  const achievements: Achievement[] = [
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

          {/* Achievements Grid */}
          <div className="px-6 pb-6">
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {achievements.map((achievement) => (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;