
import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useModalContext } from '@/contexts/ModalContext';
import HeaderNavigation from './header/HeaderNavigation';
import HeaderSearch from './header/HeaderSearch';
import CompactHeader from './clubhouse/CompactHeader';
import ScrollableTabs from './clubhouse/ScrollableTabs';
import { useAppLogo } from '@/hooks/useAppLogo';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = ({ activeTab, onTabChange }: { activeTab?: string; onTabChange?: (tab: string) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLogo } = useAppLogo();
  const { shouldHideHeader } = useModalContext();
  const isMobile = useIsMobile();

  // Hide header when modals are active
  if (shouldHideHeader) {
    return null;
  }

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  // Always sticky on clubhouse page, relative everywhere else  
  const isClubhousePage = location.pathname === '/clubhouse';
  const headerClasses = isClubhousePage ? "sticky top-0 z-[60]" : "relative z-[60]";
  
  // Simplified safe area handling - let CSS handle the padding
  const headerStyle = {};

  // Check if we should use compact mode (≤375px and mobile)
  const useCompactMode = isClubhousePage && isMobile && (typeof window !== 'undefined' && window.innerWidth <= 375);

  if (isClubhousePage) {
    // Clubhouse unified header with both rows
    return (
      <header className={headerClasses} style={headerStyle}>
        <div className="backdrop-blur-md bg-black/35">
          {useCompactMode ? (
            <div className="px-3">
              <CompactHeader />
              {/* Tabs row for compact */}
              <div className="bg-transparent">
                <ScrollableTabs 
                  activeTab={activeTab || 'Following'} 
                  onTabChange={onTabChange || (() => {})} 
                />
              </div>
            </div>
          ) : (
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
                    src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
                    alt="clbhouz Logo"
                    className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0 brightness-0 invert"
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
              
              {/* Tabs row */}
              <div className="bg-transparent">
                <ScrollableTabs 
                  activeTab={activeTab || 'Following'} 
                  onTabChange={onTabChange || (() => {})} 
                />
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Standard header for other pages
  return (
    <header className={headerClasses} style={headerStyle}>
      <div className="container mx-auto compact-header-padding max-w-full box-border backdrop-blur-md px-3 md:px-4">
        {useCompactMode ? (
          <CompactHeader />
        ) : (
          <div className="flex items-center justify-between h-16 max-w-full">
            {/* Logo - Orange mark + White text */}
            <div className="flex items-center flex-shrink-0 gap-1 md:gap-2 py-1 min-w-0">
              <img
                src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
                alt="Logo Mark"
                className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0"
                onClick={handleLogoClick}
              />
              <img
                src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
                alt="clbhouz Logo"
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
        )}
      </div>
    </header>
  );
};

export default Header;
