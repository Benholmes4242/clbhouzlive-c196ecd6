import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, Settings } from 'lucide-react';
import HeaderNavigation from '../header/HeaderNavigation';
import SearchPill from './SearchPill';
import ScrollableTabs from './ScrollableTabs';
import { useAppLogo } from '@/hooks/useAppLogo';

interface ClubhouseHeaderRedesignedProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ClubhouseHeaderRedesigned: React.FC<ClubhouseHeaderRedesignedProps> = ({ 
  className = "",
  activeTab = 'Following',
  onTabChange = () => {}
}) => {
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();
  const [searchOpen, setSearchOpen] = useState(false);

  // Fade-away logic
  useEffect(() => {
    const header = document.querySelector('[data-hides-on-scroll]');
    const sentinel = document.getElementById('clubhouse-sentinel');
    
    if (!header || !sentinel) return;

    const io = new IntersectionObserver(([e]) => {
      const visible = e.isIntersecting;
      const currentStyle = header.getAttribute('style') || '';
      const baseStyle = currentStyle.split(';opacity:')[0]; // Remove existing opacity/transform
      
      header.setAttribute('style', 
        `${baseStyle};opacity:${visible ? 1 : 0};transform:${visible ? 'translateY(0)' : 'translateY(-12px)'};pointer-events:${visible ? 'auto' : 'none'}`
      );
      document.body.classList.toggle('header-hidden', !visible);
    }, { threshold: 0 });
    
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  return (
    <>
      {/* Main Header */}
      <header 
        className={`sticky top-0 z-60 backdrop-blur-md transition-all duration-300 ${className}`}
        data-hides-on-scroll
        style={{ '--header-h-mobile': '60px' } as React.CSSProperties}
      >
        {/* Sentinel for fade-away detection - positioned at top of content area */}
        <div id="clubhouse-sentinel" className="absolute top-full h-px w-px" />
        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="Logo Mark"
              className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            />
            <img
              src="/assets/clbhouz-white-logo.png"
              alt="clbhouz Logo White"
              className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            />
          </div>

          {/* Desktop search pill */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchPill className="w-full max-w-xl" />
          </div>

          {/* Right utilities (more spacing) */}
          <nav className="flex items-center space-x-4 md:space-x-6">
            {/* Mobile search button */}
            <button 
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </button>
            
            {/* Other navigation icons */}
            <HeaderNavigation />
          </nav>
        </div>
        
        {/* Tabs row */}
        <div className="bg-transparent">
          <ScrollableTabs 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
          />
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-x-0 top-0 z-[70] p-3">
          <div className="rounded-full bg-white/7 backdrop-blur-2xl border border-white/15 shadow-[var(--hud-shadow)]">
            <SearchPill autoFocus onClose={() => setSearchOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default ClubhouseHeaderRedesigned;
