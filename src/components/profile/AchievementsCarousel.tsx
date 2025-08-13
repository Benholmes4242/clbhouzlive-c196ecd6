import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';

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
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fill with locked achievements if needed
  const displayAchievements = [...achievements];
  while (displayAchievements.length < 4) {
    displayAchievements.push({
      id: `locked-${displayAchievements.length}`,
      name: 'Locked Achievement',
      xp: 0,
      unlocked: false,
      description: 'Keep playing to unlock this achievement!'
    });
  }

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

  const getAchievementBadge = (achievement: Achievement) => {
    if (achievement.iconURL) {
      return (
        <img 
          src={achievement.iconURL} 
          alt={achievement.name}
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className={`w-full h-full flex items-center justify-center text-4xl ${
        achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
      }`}>
        🏆
      </div>
    );
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
                  className={`w-20 h-20 rounded-full mb-2 shadow-lg transition-all duration-300 hover:scale-105 ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                      : 'bg-gray-300'
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