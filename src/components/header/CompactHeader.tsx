import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import HeaderNavigation from './HeaderNavigation';
import SearchPill from '@/components/clubhouse/SearchPill';
import { cn } from '@/lib/utils';

interface CompactHeaderProps {
  className?: string;
}

/**
 * Compact Header (56px) - used on Discover, Tour, Notifications
 * Sticky at top, hides on scroll down, re-appears on scroll up
 */
const CompactHeader: React.FC<CompactHeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const { isHidden } = useScrollDirection();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  return (
    <>
      <header
        className={cn(
          "compact-header",
          "sticky top-0 z-header",
          "h-14", // 56px
          "transition-transform duration-200 ease-out",
          isHidden && "-translate-y-full",
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
