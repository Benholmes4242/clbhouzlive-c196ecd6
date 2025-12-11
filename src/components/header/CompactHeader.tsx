import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from 'lucide-react';
import { IoMdNotificationsOutline } from "react-icons/io";
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HeaderNavigation from './HeaderNavigation';
import SearchPill from '@/components/clubhouse/SearchPill';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
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
  const { isHidden: scrollHidden } = useScrollDirection();
  const { user } = useSupabaseSession();
  const { hasUnread } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // On Clubhouse, use the chrome system (body.chrome-hidden .chrome-header)
  // On other pages, use scroll direction
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
          // Add chrome-header class on Clubhouse for auto-hide system
          isClubhousePage && "chrome-header",
          "fixed top-0 left-0 right-0 z-header",
          "h-14", // 56px
          // On non-Clubhouse pages, use scroll direction transition + hide/show
          // On Clubhouse, chrome-autohide.css handles the transition
          !isClubhousePage && "transition-transform duration-200 ease-out",
          !isClubhousePage && scrollHidden && "-translate-y-full",
          className
        )}
        style={{
          background: 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="mx-auto flex h-full items-center justify-between px-4 max-w-5xl">
          {/* Left: Logo */}
          <button
            type="button"
            className="flex items-center gap-1.5 shrink-0 bg-transparent border-0 cursor-pointer"
            onClick={handleLogoClick}
          >
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="Logo Mark"
              className="h-8 w-auto object-contain hover:opacity-80 transition-opacity"
            />
            {/* Hide text logo on mobile to make room for posting-as pill */}
            <img
              src="/assets/clbhouz-white-logo.png"
              alt="clbhouz Logo"
              className="h-8 w-auto object-contain hover:opacity-80 transition-opacity hidden sm:block"
            />
          </button>

          {/* Centre: Posting-as pill (mobile only, logged in users) */}
          {user && (
            <div className="flex-1 flex justify-center sm:hidden px-2">
              <PostingAsPill 
                onClick={() => setMenuOpen(v => !v)} 
                isOpen={menuOpen}
              />
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Notifications (mobile) - only show on mobile when logged in */}
            {user && (
              <div className="relative sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9"
                  onClick={() => navigate('/notificationmessages')}
                  aria-label="Notifications"
                >
                  <IoMdNotificationsOutline className="h-5 w-5" />
                </Button>
                {hasUnread && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500 border-2 border-[rgb(10,10,10)]" />
                )}
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

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <>
          <div 
            className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 z-[70] p-3">
            <div className="rounded-full backdrop-blur-2xl bg-hud-bg border-hud-border border shadow-hud">
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

export default CompactHeader;
