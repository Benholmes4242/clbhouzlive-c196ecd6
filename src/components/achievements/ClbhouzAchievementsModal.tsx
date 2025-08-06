import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      { title: "First Post", emoji: "📸", isEarned: true },
      { title: "Course Explorer", emoji: "⛳", isEarned: true },
      { title: "Video Master", emoji: "🎥", isEarned: false },
      { title: "Social Butterfly", emoji: "🦋", isEarned: false },
      { title: "Eagle Eye", emoji: "🦅", isEarned: true },
      { title: "Birdie Collector", emoji: "🐦", isEarned: false },
    ];
    
    const achievement = mockAchievements[index % mockAchievements.length];
    
    return {
      id: `achievement-${index}`,
      title: achievement.title,
      xp: 250,
      emoji: achievement.emoji,
      isEarned: achievement.isEarned,
      description: "Complete this challenge to earn XP"
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Clbhouz Achievements Tray</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
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

          {/* XP Progress Section */}
          <div className="px-6 pb-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Total XP: {totalXP.toLocaleString()} | Next: Gold Ring at {nextMilestone.toLocaleString()} XP
                </p>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((totalXP / nextMilestone) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-3 gap-4">
              {achievementGrid.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`
                    border rounded-lg p-4 text-center transition-all duration-200 hover:scale-105
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
              ))}
            </div>
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