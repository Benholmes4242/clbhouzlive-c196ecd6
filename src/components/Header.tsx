
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useModalContext } from '@/contexts/ModalContext';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import HeaderNavigation from './header/HeaderNavigation';
import HeaderSearch from './header/HeaderSearch';
import CompactHeader from './clubhouse/CompactHeader';
import SearchPill from './clubhouse/SearchPill';
import { Search } from 'lucide-react';
import ScrollableTabs from './clubhouse/ScrollableTabs';
import { useAppLogo } from '@/hooks/useAppLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Header = ({ activeTab, onTabChange }: { activeTab?: string; onTabChange?: (tab: string) => void }) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLogo } = useAppLogo();
  const { shouldHideHeader } = useModalContext();
  const { variant } = useHeaderVariant();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  // Set header variant based on current page
  useEffect(() => {
    // This will be overridden by individual pages
  }, [location.pathname]);

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("[DEBUG] Header mounted", "pathname:", location.pathname);
  }, [location.pathname]);

  // Handle mobile search overlay
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [searchOpen]);

  // NOW WE CAN SAFELY DO CONDITIONAL RETURNS - ALL HOOKS CALLED ABOVE
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
  
  // For Clubhouse, don't render this Header component - let the page handle its own header
  if (isClubhousePage) {
    console.log("[DEBUG] Skipping Header for Clubhouse page - using ClubhouseHeaderNew");
    return null;
  }

  // Check if we should use compact mode (≤375px and mobile) for other pages
  const useCompactMode = isMobile && (typeof window !== 'undefined' && window.innerWidth <= 375);

  // Standard header for other pages
  console.log("[DEBUG] Rendering standard header for path:", pathname, "useCompactMode:", useCompactMode);

  // Get variant-specific styles
  const isGlassDark = variant === 'glass-dark';
  const isSolidLight = variant === 'solid-light';
  
  // Logo source based on variant
  const logoSrc = isGlassDark 
    ? "/assets/clbhouz-white-logo.png" 
    : "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png";

  // Standard header for other pages
  return (
    <>
      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 z-header transition-all duration-300",
          "h-16 md:h-18", // 64px mobile, 72px desktop
          // Variant-specific backgrounds
          isGlassDark && "backdrop-blur-md bg-black/60",
          isSolidLight && "bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm",
          headerClasses
        )}
        style={{ '--header-h-mobile': '60px' } as any}
      >
        <div className="mx-auto flex h-full items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="Logo Mark"
              className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            />
            <img
              src={logoSrc}
              alt="clbhouz Logo"
              className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            />
          </div>

          {/* Desktop Search Pill */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchPill className="w-full max-w-xl" variant={variant} />
          </div>

          {/* Right Utilities */}
          <nav className="flex items-center space-x-2">
            {/* Mobile Search Button */}
            <button 
              className={cn(
                "md:hidden p-2 rounded-full transition-colors",
                isGlassDark && "hover:bg-white/10",
                isSolidLight && "hover:bg-black/10"
              )}
              onClick={() => setSearchOpen(true)}
            >
              <Search className={cn(
                "h-5 w-5",
                isGlassDark && "text-white",
                isSolidLight && "text-black"
              )} />
            </button>
            
            {/* Navigation Icons */}
            <HeaderNavigation />
          </nav>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <>
          {/* Background overlay */}
          <div 
            className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Search pill overlay */}
          <div className="fixed inset-x-0 top-0 z-[70] p-3">
            <div className={cn(
              "rounded-full backdrop-blur-2xl border shadow-hud",
              isGlassDark && "bg-hud-bg border-hud-border",
              isSolidLight && "bg-white/95 border-gray-200"
            )}>
              <SearchPill 
                autoFocus 
                onClose={() => setSearchOpen(false)}
                placeholder="Search clbhouz..."
                variant={variant}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
