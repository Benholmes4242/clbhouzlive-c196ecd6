import React, { useRef, useEffect, useState } from 'react';
import { Activity, BookOpen, Trophy, BarChart3 } from 'lucide-react';

interface GlassTabsBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const tabs = [
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'handicap', label: 'Handicap', icon: BarChart3 },
];

const GlassTabsBar: React.FC<GlassTabsBarProps> = ({ activeSection, onSectionChange }) => {
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeSection);
    const activeTab = tabsRef.current[activeIndex];
    
    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab;
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        transform: 'none',
        transition: 'left 250ms ease-in-out, width 250ms ease-in-out',
      });
    }
  }, [activeSection]);

  return (
    <div className="w-full mt-2">
      <div className="bg-black/65 backdrop-blur-md border-y border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] px-3 md:px-4 py-2 md:py-3">
        <div className="relative flex">
          {/* Sliding Echo Accent Glow Bar */}
          <div
            className="absolute bottom-0 h-1 bg-echo-accent rounded-full shadow-[0_0_12px_rgba(110,146,119,0.8)]"
            style={indicatorStyle}
          />
          
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            
            return (
              <button
                key={tab.id}
                ref={(el) => (tabsRef.current[index] = el)}
                onClick={() => onSectionChange(tab.id)}
                className={`
                  flex-1 flex items-center justify-center py-3 px-2
                  text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }
                  hover:backdrop-blur-sm rounded-lg
                `}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GlassTabsBar;