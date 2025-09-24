
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
    { id: 'courses', label: 'Courses', icon: MapPin },
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
      {/* Tab Bar - text-only with orange underline */}
      <nav className="px-6">
        <div className="flex overflow-x-auto gap-6 border-b border-white/20 pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                disabled={transitionState !== 'idle'}
                className={`
                  relative pb-2 text-base whitespace-nowrap transition-all duration-200
                  ${isActive ? 'font-semibold text-white' : 'text-white/70 hover:text-white/90'}
                  ${transitionState !== 'idle' ? 'pointer-events-none' : ''}
                `}
              >
                {tab.label}
                <span
                  className={`
                    absolute left-0 right-0 -bottom-[1px] h-[3px] rounded-full transition-all duration-200
                    ${isActive ? 'bg-[#ff8a00]' : 'bg-transparent'}
                  `}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <div className={`pt-0 pb-1 ${activeTab === 'activity' ? 'md:px-0' : activeTab === 'achievements' ? 'px-0' : 'px-4 md:px-0'}`}>
        <div className={`${activeTab === 'achievements' ? 'w-full' : 'md:max-w-[1150px] md:mx-auto'}`}>
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
