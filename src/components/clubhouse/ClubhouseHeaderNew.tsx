import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAppLogo } from '@/hooks/useAppLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import SearchPill from './SearchPill';
import HeaderNavigation from '@/components/header/HeaderNavigation';
import { cn } from '@/lib/utils';

interface ClubhouseHeaderNewProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ClubhouseHeaderNew = ({ className, activeTab, onTabChange }: ClubhouseHeaderNewProps) => {
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();
  const { variant } = useHeader();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);

  // Get variant-specific styles
  const isGlassDark = variant === 'glass-dark';
  const isSolidLight = variant === 'solid-light';
  
  // Logo source based on variant
  const logoSrc = isGlassDark 
    ? "/assets/clbhouz-white-logo.png" 
    : "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png";

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  // Add intersection observer for fade-away behavior
  useEffect(() => {
    const header = document.querySelector('[data-hides-on-scroll]');
    const sentinel = document.getElementById('clubhouse-sentinel');
    
    if (!header || !sentinel) return;

    const io = new IntersectionObserver(([e]) => {
      const visible = e.isIntersecting;
      const currentStyle = header.getAttribute('style') || '';
      const baseStyle = '--header-h-mobile:60px';
      
      header.setAttribute('style', 
        `${baseStyle};opacity:${visible ? 1 : 0};transform:${visible ? 'translateY(0)' : 'translateY(-12px)'};pointer-events:${visible ? 'auto' : 'none'}`
      );
      
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

  return (
    <>
      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 z-header transition-all duration-300",
          "h-16 md:h-18", // 64px mobile, 72px desktop
          // Variant-specific backgrounds
          isGlassDark && "backdrop-blur-md bg-black/60",
          isSolidLight && "bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm",
          className
        )}
        data-hides-on-scroll
        style={{ '--header-h-mobile': '60px' } as any}
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
            <SearchPill className="w-full max-w-xl" variant={variant} />
          </div>

          {/* Right Utilities */}
          <nav className="flex items-center space-x-2">
            {/* Mobile Search Button */}
            <button 
              className={cn(
                "md:hidden p-2 rounded-full transition-colors",
                isGlassDark && "hover:bg-white/10",
                isSolidLight && "hover:bg-black/10"
              )}
              onClick={() => setSearchOpen(true)}
            >
              <Search className={cn(
                "h-5 w-5",
                isGlassDark && "text-white",
                isSolidLight && "text-black"
              )} />
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
            className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Search pill overlay */}
          <div className="fixed inset-x-0 top-0 z-[70] p-3">
            <div className={cn(
              "rounded-full backdrop-blur-2xl border shadow-hud",
              isGlassDark && "bg-hud-bg border-hud-border",
              isSolidLight && "bg-white/95 border-gray-200"
            )}>
              <SearchPill 
                autoFocus 
                onClose={() => setSearchOpen(false)}
                placeholder="Search clbhouz..."
                variant={variant}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ClubhouseHeaderNew;