import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import AchievementDetailModal from '@/components/achievements/AchievementDetailModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface Achievement {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
  unlockHint?: string;
  progress?: string;
  isRepeatable?: boolean;
}

interface AchievementsCarouselProps {
  achievements: Achievement[];
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
  className?: string;
}

const AchievementsCarousel: React.FC<AchievementsCarouselProps> = ({
  achievements,
  userId,
  userDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser,
  className = ''
}) => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);

  // Sample achievements with detailed data matching ClbhouzAchievementsModal
  const sampleAchievements = [
    // Top row - all unlocked
    { id: '1', name: '20 Club', xp: 200, unlocked: true, description: 'Reach the milestone of 20 courses played. You\'re getting started on your golf journey!', progress: '20 / 20 courses', isRepeatable: false },
    { id: '2', name: '50 Club', xp: 300, unlocked: true, description: 'Reach the milestone of 50 courses played. You\'re getting serious!', progress: '50 / 50 courses', isRepeatable: false },
    { id: '3', name: 'Eagle Collector', xp: 250, unlocked: true, description: 'Accumulate 5 total eagles throughout your golf journey.', progress: '5 / 5 eagles', isRepeatable: false },
    { id: '4', name: '100 Century Club', xp: 500, unlocked: true, description: 'Join the exclusive 100 courses club. True dedication to the game!', progress: '100 / 100 courses', isRepeatable: false },
    // Bottom row - mixed unlock states
    { id: '5', name: 'Par Machine', xp: 300, unlocked: true, description: 'Master the art of consistent par scoring. Show your steady play!', progress: '50 / 50 pars', isRepeatable: false },
    { id: '6', name: 'Stars and Stripes Tourer', xp: 350, unlocked: true, description: 'Conquer the golf courses across the United States.', progress: '15 / 15 courses', isRepeatable: false },
    { id: '7', name: 'Birdie Blitz', xp: 75, unlocked: false, description: 'Master the art of consistent birdie scoring. Show your precision!', unlockHint: '5 more birdies to unlock', progress: '12 / 15 birdies', isRepeatable: false },
    { id: '8', name: 'Globetrotter Golfer', xp: 400, unlocked: false, description: 'Play golf courses across multiple continents around the world.', unlockHint: 'Play courses on more continents', progress: '2 / 4 continents', isRepeatable: false }
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
      case "Par Machine":
        return <img src="/lovable-uploads/51973f3e-599d-4110-bcf6-8eac43b963f8.png" alt="Par Machine Badge" className="w-full h-full object-cover" />;
      case "Globetrotter Golfer":
        return <img src="/lovable-uploads/684002ed-a5a9-46e9-a1fc-384da5a7c686.png" alt="Globetrotter Golfer Badge" className="w-full h-full object-cover" />;
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
      <div className={`w-full mb-2 md:mb-4 py-1 md:py-0 ${className}`}>
        {/* Desktop: max-width container with centered content */}
        <div className="md:max-w-[1150px] md:mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8 px-4 md:px-0 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl text-foreground">Achievements</h3>
            </div>
            <button
              onClick={() => setAchievementsModalOpen(true)}
              className="flex items-center gap-0.5 text-[0.8125rem] font-medium text-muted-foreground min-h-[44px] active:scale-95 transition-transform"
            >
              See All
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Static Grid Layout - No carousel */}
          <div className="px-4 md:px-0">
            {/* Desktop: 4x2 grid (8 achievements), Mobile: 3x2 grid (6 achievements) */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {/* Show first 6 achievements on mobile, 8 on desktop */}
              {displayAchievements.slice(0, isMobile ? 6 : 8).map((achievement, index) => (
                <div key={achievement.id} className="flex flex-col items-center cursor-pointer">
                  <div 
                    className={`w-20 h-20 md:w-24 md:h-24 transition-all duration-300 overflow-hidden ${
                      !achievement.unlocked ? 'grayscale opacity-60' : ''
                    }`}
                    onClick={() => {
                      setSelectedAchievement(achievement);
                      setShowAchievementDetailModal(true);
                    }}
                  >
                    {getAchievementBadge(achievement)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-1 text-center line-clamp-2 leading-tight">
                    {achievement.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        isOpen={showAchievementDetailModal}
        onClose={() => setShowAchievementDetailModal(false)}
        achievement={selectedAchievement}
      />

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