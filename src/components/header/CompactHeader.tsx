import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell } from 'lucide-react';
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
          {/* Left: Logo icon only */}
          <button
            type="button"
            className="flex items-center shrink-0 bg-transparent border-0 cursor-pointer"
            onClick={handleLogoClick}
            aria-label="Go to home"
          >
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="clbhouz"
              className="h-9 w-9 object-contain hover:opacity-80 transition-opacity"
            />
          </button>

          {/* Right: Search + Bell + Identity pill */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0 flex items-center justify-center"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Notifications Bell (mobile) */}
            {user && (
              <div className="relative sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0 flex items-center justify-center"
                  onClick={() => navigate('/notificationmessages')}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {hasUnread && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-orange-500 ring-[1.5px] ring-[rgb(10,10,10)]" />
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
