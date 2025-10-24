import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useModalContext } from '@/contexts/ModalContext';
import HeaderNavigation from './header/HeaderNavigation';
import SearchPill from './clubhouse/SearchPill';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Routes where header should be hidden
const HIDDEN_ROUTES = [
  '/auth',
  '/create-profile',
  '/admin-setup',
  '/profile', // Profile page uses its own header
  // Add more full-screen routes as needed
];

// Routes that use glass-dark variant
const GLASS_DARK_ROUTES = [
  '/', 
  '/clubhouse',
  '/profile',
  // Add other routes that need dark glass header
];

const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const { variant, setVariant, isVisible } = useHeader();
  const { shouldHideHeader } = useModalContext();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);

  // Check for data-immersive attribute AND ecm-open body class
  useEffect(() => {
    const checkImmersive = () => {
      const hasImmersiveAttr = document.documentElement.hasAttribute('data-immersive');
      const hasEcmClass = document.body.classList.contains('ecm-open');
      setIsImmersive(hasImmersiveAttr || hasEcmClass);
    };
    
    // Check initially
    checkImmersive();
    
    // Watch for changes to data-immersive attribute
    const htmlObserver = new MutationObserver(checkImmersive);
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-immersive']
    });
    
    // Watch for changes to body class
    const bodyObserver = new MutationObserver(checkImmersive);
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      htmlObserver.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  // Determine if current route should hide header
  // Check for exact matches OR if pathname starts with /profile (to catch /profile/:username)
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname) || 
    location.pathname.startsWith('/profile');
  const isClubhousePage = location.pathname === '/' || location.pathname === '/clubhouse';
  
  // Set header variant - always use glass-dark now (liquid glass everywhere)
  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  // Force header to always show (unless specifically hidden for routes like auth)
  const showHeader = !shouldHideForRoute && !shouldHideHeader && !isImmersive;
  
  // Debug logging
  console.log('🔍 GlobalHeader MOUNTED - Component is rendering');
  console.log('🔍 GlobalHeader state:', {
    isVisible,
    shouldHideForRoute,
    shouldHideHeader,
    isImmersive,
    showHeader,
    pathname: location.pathname,
    hasDataImmersive: document.documentElement.hasAttribute('data-immersive')
  });
  
  console.log('🔍 HIDDEN_ROUTES:', HIDDEN_ROUTES);
  console.log('🔍 Current pathname:', location.pathname);
  console.log('🔍 Body classes:', document.body.className);

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

  const handleLogoClick = () => {
    // Navigate to clubhouse/home
    window.location.href = '/clubhouse';
  };

  return (
    <>
      {/* Global Fixed Header - Using Clubhouse Style */}
      <AnimatePresence>
        {showHeader && (
          <header
            className={cn(
              "chrome-header", // Chrome auto-hide class
              "relative z-header",
              "h-16 md:h-18", // 64px mobile, 72px desktop
              "backdrop-blur-md bg-black/60" // Clubhouse glass-dark style everywhere
            )}
            data-hides-on-scroll
            data-chrome="header"
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
                  src="/assets/clbhouz-white-logo.png"
                  alt="clbhouz Logo"
                  className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity"
                  onClick={handleLogoClick}
                />
              </div>

              {/* Desktop Search Pill */}
              <div className="hidden md:flex flex-1 justify-center px-4">
                <SearchPill 
                  className="w-full max-w-xl" 
                  variant="glass-dark"
                  isClubhousePage={true}
                />
              </div>

              {/* Right Utilities */}
              <nav className="flex items-center space-x-1 md:space-x-4">
                {/* Mobile Search Button */}
                <button 
                  data-action="search"
                  className="md:hidden p-2 md:p-3 flex-shrink-0 mt-3 transition-colors hover:bg-white/10 text-white/80 hover:text-white"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </button>
                
                {/* Navigation Icons */}
                <HeaderNavigation />
              </nav>
            </div>
          </header>
        )}
      </AnimatePresence>
      
      {/* Spacer to neutralize pages that use negative top margins (e.g., Profile) */}
      {showHeader && location.pathname.startsWith('/profile') && (
        <div
          className="app-shell--topSpacer"
          style={{
            height: 'var(--header-height)',
          }}
        />
      )}

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
            <div className="rounded-full backdrop-blur-2xl border shadow-hud bg-hud-bg border-hud-border">
              <SearchPill 
                autoFocus 
                onClose={() => setSearchOpen(false)}
                placeholder="Search clbhouz..."
                variant="glass-dark"
                isClubhousePage={true}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobalHeader;