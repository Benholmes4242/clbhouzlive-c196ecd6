
import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
    achievements: React.ReactNode;
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
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const tabs = [
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'courses', label: isMobile ? 'Courses' : 'Courses Played', icon: MapPin },
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
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  } ${transitionState !== 'idle' ? 'pointer-events-none' : ''}`}
                >
                  <span className="whitespace-nowrap text-xl md:text-2xl text-black font-medium">{tab.label}</span>
                  {/* Underline only under text label */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gray-600 dark:bg-gray-400 w-1/2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`py-0.5 md:py-0.5 ${activeTab === 'activity' ? 'md:px-0' : 'px-4 md:px-0'}`}>
        <div className={`md:max-w-[1150px] md:mx-auto`}>
          {activeTab === 'activity' && children.activity}
          {activeTab === 'courses' && children.courses}
          {activeTab === 'achievements' && children.achievements}
          {activeTab === 'stats' && children.stats}
        </div>
      </div>

    </div>

  );
};

export default ProfileTabs;
