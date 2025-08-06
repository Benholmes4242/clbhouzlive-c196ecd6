import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { XPRingSystem } from "@/components/profile/XPRingSystem";

interface ClbhouzAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
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
  const currentLevel = "Green XP Ring"; // This would be calculated based on your ring system

  // Create a grid of achievements (mock data for now)
  const achievementGrid = Array.from({ length: 15 }, (_, index) => {
    const mockAchievements = [
      { 
        title: "First Post", 
        emoji: "📸", 
        isEarned: true, 
        description: "Share your first golf course experience with the community. Welcome to Clbhouz!",
        progress: "1/1"
      },
      { 
        title: "Course Explorer", 
        emoji: "⛳", 
        isEarned: true, 
        description: "Visit and explore 5 different golf courses. Discover new favorites!",
        progress: "5/5"
      },
      { 
        title: "Video Master", 
        emoji: "🎥", 
        isEarned: false, 
        description: "Upload and share 10 course videos. Show off those perfect swings!",
        progress: "3/10"
      },
      { 
        title: "Social Butterfly", 
        emoji: "🦋", 
        isEarned: false, 
        description: "Connect with 25 fellow golfers in the community. Build your network!",
        progress: "12/25"
      },
      { 
        title: "Eagle Eye", 
        emoji: "🦅", 
        isEarned: true, 
        description: "Score an eagle on any course. Exceptional shot making!",
        progress: "1/1"
      },
      { 
        title: "Birdie Collector", 
        emoji: "🐦", 
        isEarned: false, 
        description: "Score 50 birdies across all your rounds. Keep up the great play!",
        progress: "23/50"
      },
    ];
    
    const achievement = mockAchievements[index % mockAchievements.length];
    
    return {
      id: `achievement-${index}`,
      title: achievement.title,
      xp: 250,
      emoji: achievement.emoji,
      isEarned: achievement.isEarned,
      description: achievement.description,
      progress: achievement.progress
    };
  });

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
                    {userHandicap ? `Handicap: ${userHandicap}` : 'No handicap set'} | {currentLevel}
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
          <div className="px-6 pb-4">
            <TooltipProvider>
              <div className="grid grid-cols-3 gap-4">
                {achievementGrid.map((achievement) => (
                  <Tooltip key={achievement.id}>
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
                          +{achievement.xp} XP
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="text-center">
                        <h4 className="font-semibold mb-1">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <p className="text-xs font-medium">
                          Progress: {achievement.progress}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Leaderboard Section */}
          <div className="px-6 pb-6">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Leaderboard: Top Achievers This Month | All-Time | Friends
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClbhouzAchievementsModal;