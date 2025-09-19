
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useModalContext } from '@/contexts/ModalContext';
import HeaderNavigation from './header/HeaderNavigation';
import HeaderSearch from './header/HeaderSearch';
import CompactHeader from './clubhouse/CompactHeader';
import ClubhouseHeaderExpanded from './clubhouse/ClubhouseHeaderExpanded';
import ScrollableTabs from './clubhouse/ScrollableTabs';
import { useAppLogo } from '@/hooks/useAppLogo';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = ({ activeTab, onTabChange }: { activeTab?: string; onTabChange?: (tab: string) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLogo } = useAppLogo();
  const { shouldHideHeader } = useModalContext();
  const isMobile = useIsMobile();

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("[DEBUG] Header mounted", "pathname:", location.pathname);
  }, [location.pathname]);

  // Hide header when modals are active
  if (shouldHideHeader) {
    return null;
  }

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  // Always sticky on clubhouse page, relative everywhere else  
  const hashPath = location.hash && location.hash.startsWith('#/') ? location.hash.slice(1) : null;
  const pathname = hashPath || location.pathname;
  const isClubhousePage = pathname === '/clubhouse' || pathname === '/' || pathname.startsWith('/clubhouse');
  const headerClasses = isClubhousePage ? "sticky top-0 z-[60]" : "relative z-[60]";
  
  // Simplified safe area handling - let CSS handle the padding
  const headerStyle = {};

  console.log("[DEBUG] Header path:", { pathname, rawPathname: location.pathname, hash: (location as any).hash, isClubhouse: isClubhousePage });
  // For Clubhouse, always use expanded header regardless of screen size
  if (isClubhousePage) {
    console.log("[DEBUG] Rendering ClubhouseHeaderExpanded for path:", pathname);
    return (
      <ClubhouseHeaderExpanded 
        className="clubhouse-header"
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />
    );
  }

  // Check if we should use compact mode (≤375px and mobile) for other pages
  const useCompactMode = isMobile && (typeof window !== 'undefined' && window.innerWidth <= 375);

  // Standard header for other pages
  console.log("[DEBUG] Rendering standard header for path:", pathname, "useCompactMode:", useCompactMode);

  // Standard header for other pages
  return (
    <header className={`${headerClasses} global-header isolation-isolate`} style={headerStyle}>
      {/* Safe-area overlay that ONLY adds the same blur above the header */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-[env(safe-area-inset-top)]
                   h-[env(safe-area-inset-top)] backdrop-blur-md z-0"
        style={{ WebkitBackdropFilter: 'blur(12px)' }}
      />
      <div className="relative z-10">
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
      </div>
    </header>
  );
};

export default Header;
