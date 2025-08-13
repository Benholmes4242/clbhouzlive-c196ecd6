import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Achievement {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
  unlockHint?: string;
}

interface AchievementsCarouselProps {
  achievements: Achievement[];
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
}

const AchievementsCarousel: React.FC<AchievementsCarouselProps> = ({
  achievements,
  userId,
  userDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser
}) => {
  const isMobile = useIsMobile();
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Sample achievements with unlock hints for locked ones
  const sampleAchievements = [
    { id: '1', name: '20 Club', xp: 200, unlocked: true, description: 'Play your first 20 golf courses. Welcome to the clubhouse!' },
    { id: '2', name: '50 Club', xp: 300, unlocked: true, description: 'Reach the milestone of 50 courses played. You\'re getting serious!' },
    { id: '3', name: 'Eagle Collector', xp: 400, unlocked: true, description: 'Collect multiple eagles during your rounds. A true precision player!' },
    { id: '4', name: '100 Century Club', xp: 500, unlocked: false, description: 'Join the exclusive 100 courses club. True dedication to the game!', unlockHint: '22 more courses to unlock' }
  ];

  // Use sample achievements if no achievements provided, or merge with provided ones
  const displayAchievements = achievements.length > 0 ? achievements : sampleAchievements;

  const updateScrollState = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 2);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 2
      );
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, [achievements]);

  // Helper function to get achievement badge image using the same system as ClbhouzAchievementsModal
  const getAchievementBadge = (achievement: Achievement) => {
    // Use the same badge mapping as ClbhouzAchievementsModal
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
        // For locked or unknown achievements, use a placeholder
        return (
          <div className={`w-full h-full flex items-center justify-center rounded-lg ${
            achievement.unlocked 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' 
              : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600'
          }`}>
            <Trophy className="w-8 h-8" />
          </div>
        );
    }
  };

  return (
    <>
      <div className="w-full mb-6 md:mb-8">
        {/* Desktop: max-width container with centered content */}
        <div className="md:max-w-[1150px] md:mx-auto md:px-0 px-4">
          <div className="flex items-center justify-between mb-4 md:mb-6 md:py-6 md:pt-8">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-foreground" />
              <h3 className="text-xl font-semibold text-foreground">Achievements</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAchievementsModalOpen(true)}
              className="text-black hover:text-black/80"
            >
              See All
            </Button>
          </div>

          <div className="relative">
            {/* Left fade gradient */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            )}
            
            {/* Right fade gradient */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}
            
            {/* Achievements container */}
            <div 
              ref={containerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 md:justify-center"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {displayAchievements.slice(0, 6).map((achievement, index) => (
              <TooltipProvider key={achievement.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0 text-center cursor-pointer w-20 md:w-36">
                      <div 
                        className={`w-20 h-20 md:w-32 md:h-32 transition-all duration-300 hover:scale-105 overflow-hidden ${
                          !achievement.unlocked ? 'grayscale opacity-60' : ''
                        }`}
                        onClick={() => {
                          if (isMobile) {
                            setSelectedAchievement(achievement);
                            setShowAchievementModal(true);
                          }
                        }}
                      >
                        {getAchievementBadge(achievement)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-1 break-words">
                        {achievement.unlocked ? (
                          `+${achievement.xp} XP`
                        ) : (
                          achievement.unlockHint || 'Locked'
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="max-w-80 p-4 bg-background border border-border shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
                          {getAchievementBadge(achievement)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{achievement.name}</h4>
                          <p className="text-sm text-primary">+{achievement.xp} XP</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          achievement.unlocked 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {achievement.unlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Achievement Detail Modal */}
      {showAchievementModal && selectedAchievement && (
        <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
                  {getAchievementBadge(selectedAchievement)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedAchievement.name}</h3>
                  <p className="text-sm text-primary">+{selectedAchievement.xp} XP</p>
                </div>
              </DialogTitle>
              <DialogDescription className="text-left pt-2">
                {selectedAchievement.description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                selectedAchievement.unlocked 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedAchievement.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={userDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isCurrentUser}
      />
    </>
  );
};

export default AchievementsCarousel;