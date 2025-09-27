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

  // Check for data-immersive attribute
  useEffect(() => {
    const checkImmersive = () => {
      setIsImmersive(document.documentElement.hasAttribute('data-immersive'));
    };
    
    // Check initially
    checkImmersive();
    
    // Watch for changes using MutationObserver
    const observer = new MutationObserver(checkImmersive);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-immersive']
    });
    
    return () => observer.disconnect();
  }, []);

  // Determine if current route should hide header
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname);
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

  // Use white logo only on clubhouse page, black logo everywhere else
  const logoSrc = isClubhousePage 
    ? "/assets/clbhouz-white-logo.png"
    : "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png";

  return (
    <>
      {/* Global Fixed Header */}
      <AnimatePresence>
        {showHeader && (
          <header
            className={cn(
              "global-header",
              "w-full relative", // Normal document flow positioning
              "z-40", // Layer above content
              "h-16 md:h-18", // 64px mobile, 72px desktop
              "transition-colors duration-300",
              // Determine background based on page
              location.pathname === '/clubhouse' ? 
                "liquid-glass liquid-glass--elevated" : // Keep glass effect for clubhouse
                location.pathname.startsWith('/profile') ?
                "bg-white/10 backdrop-blur-2xl border border-white/20" : // Profile specific styling
                "bg-white shadow-none" // Pure white for all other pages
            )}
            style={{
              // Safe area support
              paddingTop: 'max(env(safe-area-inset-top, 0px), 4px)',
            }}
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
                <SearchPill 
                  className="w-full max-w-xl" 
                  variant="glass-dark"
                  isClubhousePage={isClubhousePage}
                />
              </div>

              {/* Right Utilities */}
              <nav className="flex items-center space-x-2">
                {/* Mobile Search Button */}
                <button 
                  className="md:hidden p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] hover:bg-white/10"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <Search className={cn(
                    "h-5 w-5",
                    isClubhousePage ? "text-white" : "text-black"
                  )} />
                </button>
                
                {/* Navigation Icons */}
                <HeaderNavigation />
              </nav>
            </div>
          </header>
        )}
      </AnimatePresence>
      
      {/* Spacer for non-profile pages only */}
      {showHeader && !location.pathname.startsWith('/profile') && (
        <div
          className="app-shell--topSpacer"
          style={{
            height: 'var(--header-height)',
          }}
        />
      )}

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[300]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Background overlay */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            
            {/* Search pill overlay */}
            <motion.div 
              className="absolute inset-x-0 top-0 p-3 z-[320]"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
              }}
            >
              <SearchPill 
                autoFocus 
                onClose={() => setSearchOpen(false)}
                placeholder="Search clbhouz..."
                variant="glass-dark"
                isClubhousePage={isClubhousePage}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalHeader;