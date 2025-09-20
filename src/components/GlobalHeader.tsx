import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppLogo } from '@/hooks/useAppLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useModalContext } from '@/contexts/ModalContext';
import SearchPill from '@/components/clubhouse/SearchPill';
import HeaderNavigation from '@/components/header/HeaderNavigation';
import { cn } from '@/lib/utils';

const GlobalHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLogo } = useAppLogo();
  const { variant, isVisible } = useHeaderVariant();
  const { shouldHideHeader } = useModalContext();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  // Check if we're on clubhouse page (which handles its own header)
  const hashPath = location.hash && location.hash.startsWith('#/') ? location.hash.slice(1) : null;
  const pathname = hashPath || location.pathname;
  const isClubhousePage = pathname === '/clubhouse' || pathname === '/' || pathname.startsWith('/clubhouse');

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

  // Hide header when modals are active, explicitly hidden, or on clubhouse
  if (shouldHideHeader || !isVisible || isClubhousePage) {
    return null;
  }

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  // Get variant-specific styles
  const isGlassDark = variant === 'glass-dark';
  const isSolidLight = variant === 'solid-light';
  
  // Logo source based on variant
  const logoSrc = isGlassDark 
    ? "/assets/clbhouz-white-logo.png" 
    : "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png";

  return (
    <>
      {/* Global Fixed Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[200] transition-all duration-300",
          "h-16 md:h-18", // 64px mobile, 72px desktop
          // Variant-specific backgrounds
          isGlassDark && "backdrop-blur-md bg-black/60",
          isSolidLight && "bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          // Set CSS custom property for header height
          '--header-height': isMobile ? '64px' : '72px'
        } as any}
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
                "min-w-[44px] min-h-[44px] flex items-center justify-center", // Accessibility: minimum tap target
                isGlassDark && "hover:bg-white/10",
                isSolidLight && "hover:bg-black/10"
              )}
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
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
            className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Search pill overlay */}
          <div 
            className="fixed inset-x-0 z-[300] p-3"
            style={{ top: 'env(safe-area-inset-top)' }}
          >
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

export default GlobalHeader;