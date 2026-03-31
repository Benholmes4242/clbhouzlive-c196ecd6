import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAppLogo } from '@/hooks/useAppLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import SearchPill from './SearchPill';
import HeaderNavigation from '@/components/header/HeaderNavigation';
import { cn } from '@/lib/utils';
import { auditComponentMount, auditSafeAreaVars, markPerformance } from '@/utils/clubhouseAudit';

interface ClubhouseHeaderNewProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  chromeState?: 'visible' | 'hidden';
}

const ClubhouseHeaderNew = ({ className, activeTab, onTabChange, chromeState = 'visible' }: ClubhouseHeaderNewProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLogo } = useAppLogo();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Detect if we're on Clubhouse or Hub routes
  const isClubhouseRoute = location.pathname === '/' || location.pathname === '/clubhouse';
  const isHubRoute = location.pathname.startsWith('/hub');
  const isDarkContext = isClubhouseRoute || isHubRoute;
  
  // Use glass-dark style for Clubhouse/Hub, light style for other pages
  const isGlassDark = isDarkContext;
  const isSolidLight = !isDarkContext;
  
  // Use white logo for dark contexts, adjust for light contexts
  const logoSrc = isDarkContext ? "/assets/clbhouz-white-logo.png" : "/assets/clbhouz-white-logo.png";

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  // Audit on mount
  useEffect(() => {
    markPerformance('header-mount-start');
    auditSafeAreaVars();
    auditComponentMount(headerRef.current, 'ClubhouseHeaderNew', {
      checkLayers: true,
      checkA11y: true
    });
    markPerformance('header-mount-end');
  }, []);

  // Add intersection observer for fade-away behavior
  useEffect(() => {
    const header = document.querySelector('[data-hides-on-scroll]');
    const sentinel = document.getElementById('clubhouse-sentinel');
    
    if (!header || !sentinel) return;

    const io = new IntersectionObserver(([e]) => {
      const visible = e.isIntersecting;
      // Avoid setting inline transforms that conflict with chrome-autohide CSS
      // We only toggle a helper class for any non-transform visuals if needed
      document.body.classList.toggle('header-hidden', !visible);
    }, { threshold: 0 });

    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

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

  // Update accessibility when chrome state changes
  useEffect(() => {
    if (!headerRef.current) return;
    
    const isHidden = chromeState === 'hidden';
    headerRef.current.setAttribute('aria-hidden', isHidden.toString());
    
    // Update tab order
    const interactiveElements = headerRef.current.querySelectorAll('button, a, input');
    interactiveElements.forEach(el => {
      if (isHidden) {
        el.setAttribute('tabindex', '-1');
      } else {
        el.removeAttribute('tabindex');
      }
    });
  }, [chromeState]);

  return (
    <>
      {/* Main Header */}
      <header
        ref={headerRef}
        className={cn(
          "chrome-header", // Chrome auto-hide class
          "fixed left-0 right-0 z-header m-0", // Fixed positioning
          className
        )}
        data-hides-on-scroll
        data-chrome="header"
        style={{ 
          // Position at top of safe area
          top: 'var(--sat)',
          '--header-h-mobile': '60px',
          // Header extends into safe area
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(64px + env(safe-area-inset-top, 0px))',
          background: isDarkContext ? 'hsl(var(--clubhouse-bg-header))' : 'var(--surface-slate)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: isDarkContext ? 'none' : '1px solid var(--border-subtle)',
        } as any}
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
              variant={isDarkContext ? "glass-dark" : "solid-light"}
              isClubhousePage={isDarkContext}
            />
          </div>

          {/* Right Utilities */}
          <nav className="flex items-center space-x-1 md:space-x-4">
            {/* Mobile Search Button */}
            <button 
              data-action="search"
              className={cn(
                "md:hidden p-2 md:p-3 flex-shrink-0 mt-3 transition-colors",
                isDarkContext && "hover:bg-white/10",
                !isDarkContext && "hover:bg-black/10"
              )}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-white" />
            </button>
            
            {/* Navigation Icons */}
            <HeaderNavigation />
          </nav>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <>
          {/* Background overlay */}
          <div 
            className="fixed inset-0 z-[70] bg-[#0a0a0a]/20 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Search pill overlay */}
          <div className="fixed inset-x-0 top-0 z-[70] p-3">
            <div className={cn(
              "rounded-full backdrop-blur-2xl border shadow-hud",
              isDarkContext && "bg-hud-bg border-hud-border",
              !isDarkContext && "bg-card border-border"
            )}>
              <SearchPill 
                autoFocus 
                onClose={() => setSearchOpen(false)}
                placeholder="Search Clbhouz..."
                variant={isDarkContext ? "glass-dark" : "solid-light"}
                isClubhousePage={isDarkContext}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ClubhouseHeaderNew;
