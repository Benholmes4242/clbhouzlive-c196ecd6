
import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import AchievementsTabContent from '@/components/achievements/AchievementsTabContent';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
  transitionState: string;
  children: {
    activity: React.ReactNode;
    courses: React.ReactNode;
    stats: React.ReactNode;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  userId,
  userDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser,
  transitionState,
  children
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);

  const tabs = [
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'courses', label: 'Courses Played', icon: MapPin },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'stats', label: 'Handicap', icon: BarChart3 }
  ];

  const updateScrollState = () => {
    const container = tabsRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 2);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 2
      );
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = tabsRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm w-full">
        <div className="relative w-full">
          {/* Left fade gradient */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/95 to-transparent z-10 pointer-events-none md:hidden" />
          )}
          
          {/* Right fade gradient */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent z-10 pointer-events-none md:hidden" />
          )}
          
          <div 
            ref={tabsRef}
            className="flex w-full"
          >
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  disabled={transitionState !== 'idle'}
                  className={`flex-1 flex items-center justify-center py-4 transition-all duration-200 text-base relative ${
                    isActive 
                      ? 'text-black' 
                      : 'text-muted-foreground hover:text-foreground'
                  } ${transitionState !== 'idle' ? 'pointer-events-none' : ''}`}
                >
                  <span className="whitespace-nowrap text-lg md:text-xl font-medium">{tab.label}</span>
                  {/* Underline only under text label */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black w-3/4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`py-6 md:py-8 ${activeTab === 'activity' ? 'md:px-0' : 'px-4 md:px-0'}`}>
        <div className={`md:max-w-[1150px] md:mx-auto`}>
          {activeTab === 'activity' && children.activity}
          {activeTab === 'courses' && children.courses}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={() => setIsAchievementsModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Open Achievements Modal
                </button>
              </div>
              
              {/* Direct Achievements Content */}
              <AchievementsTabContent
                userId={userId}
                userDisplayName={userDisplayName}
                userHandicap={userHandicap}
                userProfilePhotoUrl={userProfilePhotoUrl}
                isCurrentUser={isCurrentUser}
              />
            </div>
          )}
          {activeTab === 'stats' && children.stats}
        </div>
      </div>

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={userDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isCurrentUser}
      />
    </div>

  );
};

export default ProfileTabs;
