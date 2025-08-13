
import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';
import { useTabSlideTransition } from '@/hooks/useTabSlideTransition';
import { useCoursesJourneyPinning } from '@/hooks/useCoursesJourneyPinning';
import LatestHighlights from '@/components/courses/highlights/LatestHighlights';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userId?: string;
  isOwnProfile?: boolean;
  children: {
    activity: React.ReactNode;
    courses: React.ReactNode;
    stats: React.ReactNode;
  };
}

interface CoursesJourneyProps {
  userId: string;
  isOwnProfile: boolean;
}

const CoursesJourney: React.FC<CoursesJourneyProps> = ({ userId, isOwnProfile }) => {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-[1150px] mx-auto px-4 md:px-0 py-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">🏆 Courses Journey</h2>
          <p className="text-muted-foreground">Track your progress across the world's greatest golf courses</p>
        </div>
        
        {/* Achievement Rings - Placeholder for now */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center mb-2">
              <span className="text-white font-bold">+300</span>
            </div>
            <p className="text-xs text-muted-foreground">Links Legend</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center mb-2">
              <span className="text-white font-bold">+20</span>
            </div>
            <p className="text-xs text-muted-foreground">Course Master</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center mb-2">
              <span className="text-white font-bold">300</span>
            </div>
            <p className="text-xs text-muted-foreground">17 more courses to unlock</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 flex items-center justify-center mb-2">
              <span className="text-white font-bold">12</span>
            </div>
            <p className="text-xs text-muted-foreground">12 more birdies to unlock</p>
          </div>
        </div>
        
        {/* Highlights Tabs */}
        <div className="flex justify-center space-x-8 border-b border-border">
          <button className="pb-2 border-b-2 border-foreground text-foreground font-medium">
            My Highlights
          </button>
          <button className="pb-2 text-muted-foreground hover:text-foreground">
            All Highlights
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  userId = '',
  isOwnProfile = false,
  children
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Slide transition hook
  const { animation, handleTabTransition } = useTabSlideTransition(activeTab, onTabChange);
  
  // Courses Journey pinning hook
  const { isJourneyPinned, journeyRef, containerRef } = useCoursesJourneyPinning(activeTab);

  const tabs = [
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'courses', label: 'Courses Played', icon: MapPin },
    { id: 'stats', label: 'Handicap & Rounds', icon: BarChart3 },
    { id: 'gear', label: 'Gear & Bag', icon: User }
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
                    onClick={() => handleTabTransition(tab.id)}
                    disabled={animation.isAnimating}
                    className={`flex-shrink-0 flex items-center px-4 py-4 transition-all duration-200 text-base relative ${
                      isActive 
                        ? 'text-black' 
                        : 'text-muted-foreground hover:text-foreground'
                    } ${animation.isAnimating ? 'pointer-events-none' : ''}`}
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

      {/* Tab Content with Sliding Animations */}
      <div 
        ref={containerRef}
        className="tab-content-container relative"
      >
        {/* Courses Journey Section - Pinned when active */}
        {activeTab === 'courses' && (
          <div 
            ref={journeyRef}
            className={`transition-all duration-300 ${
              isJourneyPinned 
                ? 'fixed top-20 left-0 right-0 z-30 shadow-lg' 
                : 'relative z-10'
            }`}
          >
            <CoursesJourney 
              userId={userId}
              isOwnProfile={isOwnProfile}
            />
          </div>
        )}
        
        {/* Main Content Area */}
        <div 
          className={`${
            activeTab === 'activity' ? 'py-6 md:py-8 md:px-0' : 'py-6 md:py-8 px-4 md:px-0'
          } ${
            activeTab === 'courses' && isJourneyPinned ? 'pt-32' : ''
          } ${
            animation.isAnimating ? 'overflow-hidden' : ''
          }`}
        >
          <div className={`${
            activeTab === 'activity' ? 'md:max-w-[1150px] md:mx-auto' : 'md:max-w-[1150px] md:mx-auto'
          } ${
            animation.animationClass
          }`}>
            {activeTab === 'activity' && (
              <div className={animation.exitingTab === 'activity' ? 'tab-slide-exit-right' : ''}>
                {children.activity}
              </div>
            )}
            
            {activeTab === 'courses' && (
              <div className={animation.exitingTab === 'courses' ? 'tab-slide-exit-left' : ''}>
                {/* LatestHighlights is now part of CoursesJourney, so just show courses content */}
                {children.courses}
              </div>
            )}
            
            {activeTab === 'stats' && (
              <div className={animation.exitingTab === 'stats' ? 'tab-slide-exit-left' : ''}>
                {children.stats}
              </div>
            )}
            
            {activeTab === 'gear' && (
              <div className={animation.exitingTab === 'gear' ? 'tab-slide-exit-left' : ''}>
                <div className="text-center py-8 text-muted-foreground">Gear & Bag coming soon...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  );
};

export default ProfileTabs;
