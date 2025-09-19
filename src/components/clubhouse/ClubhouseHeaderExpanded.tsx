import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import HeaderNavigation from '../header/HeaderNavigation';
import HeaderSearch from '../header/HeaderSearch';
import ScrollableTabs from './ScrollableTabs';
import { useAppLogo } from '@/hooks/useAppLogo';

interface ClubhouseHeaderExpandedProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ClubhouseHeaderExpanded: React.FC<ClubhouseHeaderExpandedProps> = ({ 
  className = "",
  activeTab = 'Following',
  onTabChange = () => {}
}) => {
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();

  // Debug logging
  useEffect(() => {
    console.log("[DEBUG] ClubhouseHeaderExpanded mounted with props:", { activeTab, className });
  }, [activeTab, className]);

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  return (
    <header id="clubhouse-header-expanded" className={`clubhouse-header bg-background/95 backdrop-blur-md border-b border-border/50 ${className}`}>
      <div>
        <div className="px-4">
          {/* Main header row */}
          <div className="flex items-center justify-between h-16 max-w-full bg-transparent">
            {/* Logo - Orange mark + White text */}
            <div className="flex items-center flex-shrink-0 gap-1 md:gap-2 py-1 min-w-0">
              <img
                src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
                alt="Logo Mark"
                className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={handleLogoClick}
              />
              <img
                src="/assets/clbhouz-white-logo.png"
                alt="clbhouz Logo White"
                className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={handleLogoClick}
              />
            </div>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-md mx-2 md:mx-4 min-w-0">
              <HeaderSearch />
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-1 md:space-x-4 flex-shrink-0 min-w-0">
              <HeaderNavigation />
            </div>
          </div>
          
          {/* Tabs row - always included */}
          <div className="bg-transparent">
            <ScrollableTabs 
              activeTab={activeTab} 
              onTabChange={onTabChange} 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClubhouseHeaderExpanded;