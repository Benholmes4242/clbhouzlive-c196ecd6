import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import { SearchOverlay } from './SearchOverlay';
import { cn } from '@/lib/utils';

interface DiscoverHeaderLightProps {
  className?: string;
}

/**
 * Light-mode header for Discover pages
 * Uses light grey canvas with slate text
 */
const DiscoverHeaderLight: React.FC<DiscoverHeaderLightProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { hasUnread } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };
  
  const handleSearchClick = () => {
    setSearchOpen(true);
  };
  
  const handleMenuClick = () => {
    setMenuOpen(v => !v);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-header",
          "h-14 bg-[#F4F5F7]",
          className
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: '1px solid #E4E7EB',
        }}
      >
        <div className="mx-auto flex h-full items-center justify-between px-3 sm:px-4 max-w-5xl">
          {/* Left: Logo */}
          <button
            type="button"
            className="flex items-center gap-2 shrink-0 bg-transparent border-0 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={handleLogoClick}
            aria-label="Go to home"
          >
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="clbhouz"
              className="h-9 w-9 object-contain hover:opacity-80"
              style={{ filter: 'invert(0.15)' }} /* Slight darkening for light bg */
            />
            {/* Wordmark - desktop only */}
            <span className="hidden md:inline font-semibold text-lg tracking-tight text-[#1F2428]">
              clbhouz
            </span>
          </button>

          {/* Desktop center: main nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Clubhouse', path: '/clubhouse' },
              { label: 'Discover', path: '/discover' },
              { label: 'Courses', path: '/courses' },
              { label: 'Tour', path: '/tour' },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-sq-sm transition-colors duration-200",
                    isActive 
                      ? "text-[#1F2428] bg-[#E4E7EB]"
                      : "text-[#5A6270] hover:text-[#1F2428] hover:bg-[#EDEFF2]"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Search + Identity pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all text-[#5A6270] hover:text-[#1F2428] hover:bg-[#EDEFF2]"
              onClick={handleSearchClick}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Identity pill (mobile only, logged in users) */}
            {user && (
              <div className="sm:hidden">
                <PostingAsPill 
                  onClick={handleMenuClick} 
                  isOpen={menuOpen}
                  hasUnread={hasUnread}
                  useLightTheme
                />
              </div>
            )}
            
            {/* Desktop: Full navigation */}
            <div className="hidden sm:flex items-center">
              <HeaderNavigation useLightTheme />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: Posting-as menu */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme
        />
      )}

      {/* Search Overlay */}
      <SearchOverlay 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)}
        useLightTheme
      />
    </>
  );
};

export default DiscoverHeaderLight;
