import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderNavigation from '@/components/header/HeaderNavigation';
import SearchPill from '@/components/clubhouse/SearchPill';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const ProfilePageHeader: React.FC = () => {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Use black logo for profile page
  const logoSrc = "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png";

  return (
    <>
      {/* Profile Fixed Header */}
      <header
        className={cn(
          "profile-page-header",
          "fixed top-0 left-0 right-0",
          "z-40", // Layer above content
          "h-16 md:h-18", // 64px mobile, 72px desktop
          "transition-all duration-300",
          "bg-white/10 backdrop-blur-2xl border-b border-white/20"
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
              isClubhousePage={false}
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
              <Search className="h-5 w-5 text-black" />
            </button>
            
            {/* Navigation Icons */}
            <HeaderNavigation />
          </nav>
        </div>
      </header>

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
                isClubhousePage={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfilePageHeader;