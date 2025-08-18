import React, { useState, useEffect, useRef } from 'react';
import { Activity, Trophy, Target, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface EnhancedTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isVisible: boolean;
}

const EnhancedTabNavigation: React.FC<EnhancedTabNavigationProps> = ({
  activeTab,
  onTabChange,
  isVisible
}) => {
  const isMobile = useIsMobile();
  const [isSticky, setIsSticky] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({ width: 0, left: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = [
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'courses', label: 'Courses Played', icon: Target },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'stats', label: 'Handicap', icon: BarChart3 }
  ];

  // Sticky behavior on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > (isMobile ? 200 : 300));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Animated underline
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabRefs.current[activeIndex];
    
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setUnderlineStyle({
        left: offsetLeft,
        width: offsetWidth
      });
    }
  }, [activeTab, tabs]);

  if (!isVisible) return null;

  return (
    <div
      className={`${
        isSticky 
          ? 'fixed top-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200' 
          : 'relative bg-white'
      } transition-all duration-300`}
    >
      <div className="container mx-auto px-4">
        <div className="relative">
          <div className={`flex ${isMobile ? 'justify-around' : 'justify-center gap-8'}`}>
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  ref={el => tabRefs.current[index] = el}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium transition-all duration-200 ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-gray-600 hover:text-gray-900'
                  } ${isMobile ? 'text-sm' : 'text-base'}`}
                >
                  <Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <span className={isMobile ? 'hidden sm:inline' : ''}>{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Animated underline */}
          <div
            className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out"
            style={{
              left: underlineStyle.left,
              width: underlineStyle.width
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedTabNavigation;