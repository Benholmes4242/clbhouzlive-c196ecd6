import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface Achievement {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
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

  // Sample achievements with realistic titles that match the badge system
  const sampleAchievements = [
    { id: '1', name: '20 Club', xp: 200, unlocked: true, description: 'Play your first 20 golf courses. Welcome to the clubhouse!' },
    { id: '2', name: '50 Club', xp: 300, unlocked: true, description: 'Reach the milestone of 50 courses played. You\'re getting serious!' },
    { id: '3', name: 'Eagle Collector', xp: 400, unlocked: true, description: 'Collect multiple eagles during your rounds. A true precision player!' },
    { id: '4', name: 'Lynx Legend', xp: 500, unlocked: false, description: 'Master the courses of Britain & Ireland.' }
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
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-foreground" />
            <h3 className="text-xl font-semibold text-foreground">Achievements</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAchievementsModalOpen(true)}
            className="text-primary hover:text-primary/80"
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
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {displayAchievements.slice(0, 6).map((achievement, index) => (
              <div
                key={achievement.id}
                className="flex-shrink-0 text-center"
              >
                <div 
                  className={`w-20 h-20 rounded-full mb-2 shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden ${
                    !achievement.unlocked ? 'grayscale opacity-60' : ''
                  }`}
                >
                  {getAchievementBadge(achievement)}
                </div>
                {achievement.unlocked && (
                  <div className="text-xs text-muted-foreground font-medium">
                    +{achievement.xp} XP
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

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