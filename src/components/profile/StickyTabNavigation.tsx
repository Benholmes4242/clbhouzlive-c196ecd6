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
    { id: 'achievements', label: 'Achievements', icon: Trophy },
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  } ${isMobile ? 'text-base' : 'text-lg'}`}
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
            className="absolute bottom-0 h-0.5 bg-muted-foreground/40 transition-all duration-300 ease-out rounded-full"
            style={{
              left: underlineStyle.left,
              width: underlineStyle.width,
              transform: 'translateX(8px)', // Offset for padding
              marginLeft: '-8px',
              marginRight: '-8px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StickyTabNavigation;