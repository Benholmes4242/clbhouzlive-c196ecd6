import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";

interface Achievement {
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

interface AchievementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement | null;
}

const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  isOpen,
  onClose,
  achievement
}) => {
  if (!achievement) return null;

  // Helper function to get achievement badge image
  const getAchievementBadge = (achievement: Achievement) => {
    switch (achievement.name) {
      case "20 Club":
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className="w-full h-full object-cover" />;
      case "50 Club":
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className="w-full h-full object-cover" />;
      case "100 Century Club":
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className="w-full h-full object-cover" />;
      case "200 Clubhouse Elite":
        return <img src="/lovable-uploads/88ba82c3-999c-40b9-885e-313869a7e795.png" alt="200 Clubhouse Elite Badge" className="w-full h-full object-cover" />;
      case "300 Club Champion":
        return <img src="/lovable-uploads/0088ccbe-6198-4f2c-ada2-e2bf642abec3.png" alt="300 Club Champion Badge" className="w-full h-full object-cover" />;
      case "Eagle Collector":
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className="w-full h-full object-cover" />;
      case "Birdie Blitz":
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className="w-full h-full object-cover" />;
      case "Lynx Legend":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className="w-full h-full object-cover rounded-lg" />;
      case "The Continental Swinger":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Swinger Badge" className="w-full h-full object-cover rounded-lg" />;
      case "Stars and Stripes Tourer":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className="w-full h-full object-cover rounded-lg" />;
      case "Hole-in-One":
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className="w-full h-full object-cover" />;
      default:
        return (
          <div className={`w-full h-full flex items-center justify-center rounded-lg ${
            achievement.unlocked 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' 
              : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600'
          }`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden bg-background border shadow-lg">
        {/* Header */}
        <DialogHeader className="relative bg-gradient-to-b from-background to-muted p-6 pb-4">
          <DialogTitle className="text-center text-lg font-semibold text-foreground pt-2">
            {achievement.name}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Badge */}
          <div className="flex justify-center">
            <div className={`w-24 h-24 rounded-full overflow-hidden shadow-lg ${
              !achievement.unlocked ? 'grayscale opacity-60' : ''
            }`}>
              {getAchievementBadge(achievement)}
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              achievement.unlocked 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            }`}>
              {achievement.unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          {/* Description */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {achievement.description}
            </p>
          </div>

          {/* XP and Type */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-amber-500">✨</span>
              <span className="font-medium text-primary">+{achievement.xp} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{achievement.isRepeatable ? '🔄' : '🏆'}</span>
              <span className="text-muted-foreground">
                {achievement.isRepeatable ? 'Repeatable' : 'One-time'}
              </span>
            </div>
          </div>

          {/* Progress */}
          {achievement.progress && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Progress: {achievement.progress}
              </p>
            </div>
          )}

          {/* Date Earned */}
          {achievement.unlocked && achievement.dateEarned && (
            <div className="text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✅ Earned: {achievement.dateEarned}
              </p>
            </div>
          )}

          {/* Unlock Hint */}
          {!achievement.unlocked && achievement.unlockHint && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    How to unlock:
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {achievement.unlockHint}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementDetailModal;