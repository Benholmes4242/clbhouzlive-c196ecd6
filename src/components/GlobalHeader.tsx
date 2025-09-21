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
  // Add more full-screen routes as needed
];

const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const { isVisible } = useHeader();
  const { shouldHideHeader } = useModalContext();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  // Determine if current route should hide header
  const shouldHideForRoute = HIDDEN_ROUTES.includes(location.pathname);
  const isClubhousePage = location.pathname === '/' || location.pathname === '/clubhouse';

  // Final visibility state
  const showHeader = isVisible && !shouldHideForRoute && !shouldHideHeader;

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

  // Use black logo for light glass styling
  const logoSrc = "/assets/clbhouz-white-logo.png";

  return (
    <>
      {/* Global Fixed Header */}
      <AnimatePresence>
        {showHeader && (
          <motion.header
            className={cn(
              "global-header",
              "fixed top-0 left-0 right-0 w-full",
              "z-[200]", // Above content, below toasts/modals
              "h-16 md:h-18", // 64px mobile, 72px desktop
              "transition-all duration-300",
              // Light glass styling
              "backdrop-blur-md",
              "bg-white/15 border-b border-white/25"
            )}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.25 
            }}
            style={{
              // Safe area support
              paddingTop: 'max(env(safe-area-inset-top, 0px), 4px)',
              // Hardware acceleration
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
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
                  className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity filter invert"
                  onClick={handleLogoClick}
                />
              </div>

              {/* Desktop Search Pill */}
              <div className="hidden md:flex flex-1 justify-center px-4">
                <SearchPill 
                  className="w-full max-w-xl" 
                  variant="glass-dark"
                />
              </div>

              {/* Right Utilities */}
              <nav className="flex items-center space-x-2">
                {/* Mobile Search Button */}
                <button 
                  className={cn(
                    "md:hidden p-2 rounded-full transition-colors min-h-[44px] min-w-[44px]",
                    "hover:bg-white/10"
                  )}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5 text-white" />
                </button>
                
                {/* Navigation Icons */}
                <HeaderNavigation />
              </nav>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

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
              className="absolute inset-x-0 top-0 p-3"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
              }}
            >
              <div className="rounded-full backdrop-blur-2xl border shadow-hud bg-hud-bg border-hud-border">
                <SearchPill 
                  autoFocus 
                  onClose={() => setSearchOpen(false)}
                  placeholder="Search clbhouz..."
                  variant="glass-dark"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalHeader;