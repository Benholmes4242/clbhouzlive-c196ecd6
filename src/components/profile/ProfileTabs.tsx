
import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: {
    activity: React.ReactNode;
    courses: React.ReactNode;
    stats: React.ReactNode;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="relative">
          {/* Left fade gradient */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/95 to-transparent z-10 pointer-events-none" />
          )}
          
          {/* Right fade gradient */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent z-10 pointer-events-none" />
          )}
          
          <div 
            ref={tabsRef}
            className="flex overflow-x-auto scrollbar-hide px-4 md:px-8"
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
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-4 border-b-2 transition-all duration-200 ${
                    isActive 
                      ? 'border-black text-black font-bold' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="whitespace-nowrap font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-8 py-6">
        {activeTab === 'activity' && children.activity}
        {activeTab === 'courses' && children.courses}
        {activeTab === 'stats' && children.stats}
        {activeTab === 'gear' && <div className="text-center py-8 text-muted-foreground">Gear & Bag coming soon...</div>}
      </div>
    </div>

  );
};

export default ProfileTabs;
