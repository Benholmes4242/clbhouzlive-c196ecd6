import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import { SearchOverlay } from './SearchOverlay';
import { cn } from '@/lib/utils';

interface CompactHeaderProps {
  className?: string;
}

/**
 * Compact Header (56px) - used on Discover, Tour, Notifications, Clubhouse
 * On Clubhouse: Uses chrome-header class for auto-hide system (body.chrome-hidden)
 * On other pages: Uses useScrollDirection for scroll-based hide/show
 */
const CompactHeader: React.FC<CompactHeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // DISABLED: Scroll-based hiding removed - header is now always visible
  // const { isHidden: scrollHidden } = useScrollDirection();
  const { user } = useSupabaseSession();
  const { hasUnread } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Keep for reference but no longer used for hide/show logic
  const isClubhousePage = location.pathname === '/' || location.pathname.startsWith('/clubhouse');

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  return (
    <>
      <header
        data-chrome="header"
        className={cn(
          "compact-header",
          // Keep chrome-header class for compatibility but no hide/show behavior
          isClubhousePage && "chrome-header",
          "fixed top-0 left-0 right-0 z-header",
          "h-14", // 56px
          // DISABLED: No slide animations - header always visible
          // !isClubhousePage && "transition-transform duration-200 ease-out",
          // !isClubhousePage && scrollHidden && "-translate-y-full",
          className
        )}
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingTop: 'env(safe-area-inset-top)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="mx-auto flex h-full items-center justify-between px-3 sm:px-4 max-w-5xl">
          {/* Left: Logo icon (mobile) + wordmark (desktop) */}
          <button
            type="button"
            className="flex items-center gap-2 shrink-0 bg-transparent border-0 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={handleLogoClick}
            aria-label="Go to home"
          >
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="clbhouz"
              className="h-9 w-9 object-contain hover:opacity-80 transition-opacity"
            />
            {/* Wordmark - desktop only */}
            <span className="hidden md:inline text-white font-semibold text-lg tracking-tight">
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
              const isActive = location.pathname === item.path || 
                (item.path === '/clubhouse' && location.pathname === '/');
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-sq-sm transition-colors",
                    isActive 
                      ? "text-white bg-white/10" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Search + Bell + Identity pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-transform"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Notifications Bell */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-10 w-10 p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-transform"
                  onClick={() => navigate('/notificationmessages')}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 ring-[1.5px] ring-[rgb(10,10,10)]" />
                )}
              </div>
            )}
            
            {/* Identity pill (mobile only, logged in users) */}
            {user && (
              <div className="sm:hidden">
                <PostingAsPill 
                  onClick={() => setMenuOpen(v => !v)} 
                  isOpen={menuOpen}
                  hasUnread={hasUnread}
                />
              </div>
            )}
            
            {/* Desktop: Full navigation (notifications, profile, settings) */}
            <div className="hidden sm:flex items-center">
              <HeaderNavigation />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: Posting-as menu */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Search Overlay - full-screen, covers header */}
      <SearchOverlay 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </>
  );
};

export default CompactHeader;
