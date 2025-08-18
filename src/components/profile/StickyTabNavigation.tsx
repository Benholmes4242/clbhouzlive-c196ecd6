import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Trophy, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StickyTabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  transitionState: string;
}

const StickyTabNavigation: React.FC<StickyTabNavigationProps> = ({
  activeTab,
  onTabChange,
  transitionState
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const tabs = [
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'courses', label: isMobile ? 'Courses' : 'Courses Played', icon: MapPin },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'stats', label: 'Handicap', icon: BarChart3 }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldShow = scrollY > 600; // Show after scrolling past 600px
      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderTop: 'none',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
  };

  return (
    <div
      className={`fixed top-24 left-0 right-0 z-30 transition-all duration-500 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      }`}
      style={liquidGlassStyle}
    >
      <div className="relative w-full">
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/10 to-transparent z-10 pointer-events-none md:hidden" />
        )}
        
        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/10 to-transparent z-10 pointer-events-none md:hidden" />
        )}
        
        <div 
          ref={tabsRef}
          className="flex w-full overflow-x-auto scrollbar-hide"
        >
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                disabled={transitionState !== 'idle'}
                className={`flex-1 flex items-center justify-center py-4 px-2 transition-all duration-300 relative group ${
                  isActive 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white/90'
                } ${transitionState !== 'idle' ? 'pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  <span className="whitespace-nowrap text-sm font-medium">{tab.label}</span>
                </div>
                
                {/* Animated underline */}
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-white transition-all duration-300 ${
                  isActive ? 'w-16 opacity-100' : 'w-0 opacity-0 group-hover:w-8 group-hover:opacity-60'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StickyTabNavigation;