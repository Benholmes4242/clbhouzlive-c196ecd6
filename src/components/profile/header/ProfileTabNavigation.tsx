import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileTabNavigationProps {
  activeSection: string;
  onTabChange: (tabId: string) => void;
}

const ProfileTabNavigation: React.FC<ProfileTabNavigationProps> = ({
  activeSection,
  onTabChange
}) => {
  const isMobile = useIsMobile();

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'courses', label: 'Courses' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'stats', label: 'Stats' }
  ];

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200">
      <div className="relative">
        <div className={`flex ${isMobile ? 'px-4' : 'px-8 max-w-4xl mx-auto'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative py-4 px-4 text-base md:text-lg font-medium transition-colors duration-200
                ${activeSection === tab.id 
                  ? 'text-gray-900' 
                  : 'text-gray-600 hover:text-gray-800'
                }
                flex-1 text-center
              `}
            >
              {tab.label}
              {/* Gray underline animation */}
              <div className={`
                absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400
                transition-all duration-300 ease-out
                ${activeSection === tab.id 
                  ? 'scale-x-100 opacity-100' 
                  : 'scale-x-0 opacity-0'
                }
                origin-center
              `} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabNavigation;