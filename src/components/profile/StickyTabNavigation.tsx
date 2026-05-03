import React, { useState, useEffect, useRef } from 'react';
import { Activity, MapPin, Trophy, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface StickyTabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isVisible: boolean;
}

const StickyTabNavigation: React.FC<StickyTabNavigationProps> = ({
  activeTab,
  onTabChange,
  isVisible
}) => {
  const isMobile = useIsMobile();
  const [isSticky, setIsSticky] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: Tab[] = [
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'courses', label: 'Courses', icon: MapPin },
    { id: 'stats', label: 'Handicap', icon: BarChart3 }
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Make sticky when scrolled past a certain point
      setIsSticky(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update underline position when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeIndex];
    
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setUnderlineStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, tabs]);

  if (!isVisible) return null;

  return (
    <div 
      className="relative bg-transparent transition-all duration-500 ease-in-out border-b border-border/50"
    >
      <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-2' : 'px-6 py-3'}`}>
        <div className="relative">
          {/* Tab Buttons */}
          <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'} relative`}>
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  ref={(el) => tabsRef.current[index] = el}
                  onClick={() => onTabChange(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-sq-sm transition-all duration-300"
                  style={{
                    fontSize: 16,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    letterSpacing: isActive ? '-0.025em' : '0',
                  }}
                >
                  <Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  {!isMobile && <span>{tab.label}</span>}
                  {isMobile && (
                    <span className="text-sm hidden xs:inline">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Animated Underline */}
          <div 
            className="absolute bottom-0 h-[2.5px] transition-all duration-300 ease-out rounded-full"
            style={{
              left: underlineStyle.left,
              width: underlineStyle.width,
              transform: 'translateX(8px)',
              marginLeft: '-8px',
              marginRight: '-8px',
              background: 'linear-gradient(90deg, #F59E0B, #F7931E)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StickyTabNavigation;