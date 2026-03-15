import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Lightbulb } from "lucide-react";

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

  // TODO: Extract to shared utility — duplicate of getAchievementIcon in AchievementsPane.tsx
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
      case "Birdie Every Par":
        return <img src="/lovable-uploads/164a0671-f0ff-4f1e-8780-4bba8a8fe7f4.png" alt="Birdie Every Par Badge" className="w-full h-full object-cover" />;
      case "One Day, Two Courses":
        return <img src="/lovable-uploads/f8900d31-7d35-4e4e-9352-99f6198da121.png" alt="One Day Two Courses Badge" className="w-full h-full object-cover" />;
      case "Globetrotter Golfer":
        return <img src="/lovable-uploads/684002ed-a5a9-46e9-a1fc-384da5a7c686.png" alt="Globetrotter Golfer Badge" className="w-full h-full object-cover" />;
      case "Marathon Golfer":
        return <img src="/lovable-uploads/02a84f2b-af4f-4064-a7d6-bdd88575b69e.png" alt="Marathon Golfer Badge" className="w-full h-full object-cover" />;
      case "Single-Figure Handicap":
        return <img src="/lovable-uploads/066c5dd6-9e79-49f2-8e4b-935a5242850a.png" alt="Single-Figure Handicap Badge" className="w-full h-full object-cover" />;
      case "Plus Handicap Player":
        return <img src="/lovable-uploads/1779738a-184b-4a0d-85d0-b964641019d9.png" alt="Plus Handicap Player Badge" className="w-full h-full object-cover" />;
      case "Under Par Round":
        return <img src="/lovable-uploads/d7d44dea-f5cc-416d-9a01-985d48262fc6.png" alt="Under Par Round Badge" className="w-full h-full object-cover" />;
      case "First Eagle":
        return <img src="/lovable-uploads/6b62e9b3-33d7-4825-b1d7-aac6f86e4ad7.png" alt="First Eagle Badge" className="w-full h-full object-cover" />;
      case "Hole-in-One":
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className="w-full h-full object-cover" />;
      case "Back-to-Back Birdies":
        return <img src="/lovable-uploads/7e98fdc5-ab55-44e0-87ec-8b93e493b7e4.png" alt="Back-to-Back Birdies Badge" className="w-full h-full object-cover" />;
      case "No Bogey Round":
        return <img src="/lovable-uploads/1a37c1e5-56c0-4e02-a95a-cbfa8ce3a1b6.png" alt="No Bogey Round Badge" className="w-full h-full object-cover" />;
      case "Par Machine":
        return <img src="/lovable-uploads/51973f3e-599d-4110-bcf6-8eac43b963f8.png" alt="Par Machine Badge" className="w-full h-full object-cover" />;
      case "International Golfer":
        return <img src="/lovable-uploads/3c0146da-b965-42cc-b130-ef9c25727aad.png" alt="International Golfer Badge" className="w-full h-full object-cover" />;
      case "Lynx Legend":
        return <img src="/lovable-uploads/f2714e7f-418b-4c4c-ae28-e4a1b1ea8033.png" alt="Britain & Ireland Flag" className="w-full h-full object-cover rounded-lg" />;
      case "The Continental Swinger":
        return <img src="/lovable-uploads/2fd872c8-aee1-4f0d-a3b9-fcfe49dbad20.png" alt="Continental Swinger Badge" className="w-full h-full object-cover rounded-lg" />;
      case "Stars and Stripes Tourer":
        return <img src="/lovable-uploads/2b2ee6a8-e8c4-49d9-bfdf-86403c3a47b7.png" alt="USA Flag" className="w-full h-full object-cover rounded-lg" />;
      case "Legends Club":
        return <img src="/lovable-uploads/3d5aac7d-1c4d-4b41-b450-35a0d7d4d5aa.png" alt="Legends Club Badge" className="w-full h-full object-cover rounded-lg" />;
      case "Albatross Ace":
        return <img src="/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png" alt="Albatross Ace Badge" className="w-full h-full object-cover" />;
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] p-0 max-w-[560px] mx-auto"
        hideCloseButton
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-semibold text-foreground px-4 pb-2">
          {achievement.name}
        </h2>

        {/* Content */}
        <div className="px-4 pb-6 space-y-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
          {/* Badge centered */}
          <div className="flex justify-center">
            <div className={`w-20 h-20 overflow-hidden ${
              !achievement.unlocked ? 'grayscale opacity-60' : ''
            }`}>
              {getAchievementBadge(achievement)}
            </div>
          </div>
          
          {/* Status centered */}
          <div className="text-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              achievement.unlocked 
                ? 'bg-[#f59e0b]/12 text-[#d97706]' 
                : 'bg-muted text-muted-foreground'
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
              <span className="font-medium text-[#d97706]">+{achievement.xp} XP</span>
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
              <p className="text-sm text-[#d97706] font-medium">
                ✅ Earned: {achievement.dateEarned}
              </p>
            </div>
          )}

          {/* Unlock Hint */}
          {!achievement.unlocked && achievement.unlockHint && (
            <div className="bg-[#f59e0b]/8 border border-[#f59e0b]/25 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-[#d97706] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#d97706] mb-1">
                    How to unlock
                  </p>
                  <p className="text-sm text-[#d97706]/80">
                    {achievement.unlockHint}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AchievementDetailModal;