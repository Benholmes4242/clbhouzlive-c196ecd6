import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useProfileData } from '@/hooks/useProfileData';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import HeaderNavigation from './HeaderNavigation';
import SearchPill from '@/components/clubhouse/SearchPill';
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
  const { profile } = useProfileData();
  const { data: myBusinesses } = useMyBusinesses(profile?.id);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Only show building icon if user has at least one business
  const hasBusiness = (myBusinesses?.length ?? 0) > 0;
  
  // On Clubhouse, use the chrome system (body.chrome-hidden .chrome-header)
  // On other pages, use scroll direction
  const isClubhousePage = location.pathname === '/' || location.pathname.startsWith('/clubhouse');
  
  // Building icon click handler - navigates to user's business profile
  const handleBusinessIconClick = () => {
    const count = myBusinesses?.length ?? 0;
    if (count === 0) return; // Icon shouldn't be visible anyway
    
    if (count === 1) {
      // Single business → go straight to that profile
      navigate(`/business/${myBusinesses![0].business.id}`);
    } else {
      // Multiple businesses - go to first one for now
      // TODO: Future enhancement - show business switcher
      navigate(`/business/${myBusinesses![0].business.id}`);
    }
  };

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
          {/* Logo */}
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
            <img
              src="/assets/clbhouz-white-logo.png"
              alt="clbhouz Logo"
              className="h-8 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Business Hub Button - only visible when user has a business */}
            {profile && hasBusiness && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9"
                onClick={handleBusinessIconClick}
                aria-label="Business"
              >
                <Building2 className="h-5 w-5" />
              </Button>
            )}
            
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
            
            {/* Navigation Icons (notifications, profile, settings) */}
            <HeaderNavigation />
          </div>
        </div>
      </header>

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
