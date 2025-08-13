
import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';
import { useTabSlideTransition, TransitionDirection } from '@/hooks/useTabSlideTransition';
import { useIsMobile } from '@/hooks/use-mobile';
import AchievementsCarousel from './AchievementsCarousel';
import CoursesJourney from './CoursesJourney';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
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
  children
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { transitionState, transitionDirection, startTransition } = useTabSlideTransition({
    onTransitionComplete: () => {
      if (pendingTab) {
        onTabChange(pendingTab);
        setPendingTab(null);
      }
    }
  });

  const tabs = [
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'courses', label: 'Courses Played', icon: MapPin },
    { id: 'stats', label: 'Handicap & Rounds', icon: BarChart3 },
    { id: 'gear', label: 'Gear & Bag', icon: User }
  ];

  const handleTabClick = (newTab: string) => {
    if (newTab === activeTab || transitionState !== 'idle') return;
    
    // Determine transition direction based on tab order
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const newIndex = tabs.findIndex(tab => tab.id === newTab);
    const direction: TransitionDirection = newIndex > currentIndex ? 'right' : 'left';
    
    setPendingTab(newTab);
    startTransition(direction);
  };

  // Get transition classes for hero section (achievements/courses journey)
  const getHeroTransitionClass = () => {
    if (transitionState === 'idle') return '';
    
    const isMovingToCourses = pendingTab === 'courses';
    const isMovingFromCourses = activeTab === 'courses' && pendingTab !== 'courses';
    
    if (transitionState === 'sliding-out') {
      if (isMovingToCourses) {
        return 'animate-slide-out-left';
      } else if (isMovingFromCourses) {
        return 'animate-slide-out-right';
      }
    } else if (transitionState === 'sliding-in') {
      if (isMovingToCourses) {
        return isMobile ? 'animate-slide-in-from-right-bounce' : 'animate-slide-in-from-right';
      } else if (isMovingFromCourses) {
        return isMobile ? 'animate-slide-in-from-left-bounce' : 'animate-slide-in-from-left';
      }
    }
    
    return '';
  };

  // Get transition classes for main content
  const getContentTransitionClass = () => {
    if (transitionState === 'idle') return '';
    
    if (transitionState === 'sliding-out') {
      return transitionDirection === 'right' ? 'animate-slide-out-left' : 'animate-slide-out-right';
    } else if (transitionState === 'sliding-in') {
      if (transitionDirection === 'right') {
        return isMobile ? 'animate-slide-in-from-right-bounce' : 'animate-slide-in-from-right';
      } else {
        return isMobile ? 'animate-slide-in-from-left-bounce' : 'animate-slide-in-from-left';
      }
    }
    
    return '';
  };

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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="relative">
          {/* Desktop: max-width container matching achievements */}
          <div className="md:max-w-[1150px] md:mx-auto md:px-0">
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
              className="flex overflow-x-auto scrollbar-hide px-4 md:px-0 md:justify-center md:gap-8"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    disabled={transitionState !== 'idle'}
                    className={`flex-shrink-0 flex items-center px-4 py-4 transition-all duration-200 text-base relative ${
                      isActive 
                        ? 'text-black' 
                        : 'text-muted-foreground hover:text-foreground'
                    } ${transitionState !== 'idle' ? 'pointer-events-none' : ''}`}
                  >
                    <span className="whitespace-nowrap text-xl md:text-2xl">{tab.label}</span>
                    {/* Underline only under text label */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black" style={{ width: 'calc(100% - 2rem)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Achievements or Courses Journey */}
      <div className={`relative overflow-hidden ${getHeroTransitionClass()}`}>
        {(activeTab === 'courses' || (transitionState === 'sliding-in' && pendingTab === 'courses')) && (
          <CoursesJourney className={transitionState === 'sliding-in' && pendingTab === 'courses' ? getHeroTransitionClass() : ''} />
        )}
        {(activeTab !== 'courses' || (transitionState === 'sliding-in' && pendingTab !== 'courses')) && (
          <AchievementsCarousel
            achievements={[]}
            userId={userId}
            userDisplayName={userDisplayName}
            userHandicap={userHandicap}
            userProfilePhotoUrl={userProfilePhotoUrl}
            isCurrentUser={isCurrentUser}
            className={transitionState === 'sliding-in' && pendingTab !== 'courses' ? getHeroTransitionClass() : ''}
          />
        )}
      </div>

      {/* Tab Content */}
      <div className={`relative overflow-hidden ${getContentTransitionClass()} py-6 md:py-8 ${(activeTab === 'activity' || (pendingTab === 'activity' && transitionState !== 'idle')) ? 'md:px-0' : 'px-4 md:px-0'}`}>
        <div className={`md:max-w-[1150px] md:mx-auto`}>
          {(activeTab === 'activity' || (transitionState !== 'idle' && pendingTab === 'activity')) && children.activity}
          {(activeTab === 'courses' || (transitionState !== 'idle' && pendingTab === 'courses')) && children.courses}
          {(activeTab === 'stats' || (transitionState !== 'idle' && pendingTab === 'stats')) && children.stats}
          {(activeTab === 'gear' || (transitionState !== 'idle' && pendingTab === 'gear')) && <div className="text-center py-8 text-muted-foreground">Gear & Bag coming soon...</div>}
        </div>
      </div>
    </div>

  );
};

export default ProfileTabs;
