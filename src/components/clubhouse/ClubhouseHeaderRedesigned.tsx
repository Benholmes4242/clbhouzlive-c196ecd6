import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Settings } from 'lucide-react';
import { useAppLogo } from '@/hooks/useAppLogo';
import SearchPill from './SearchPill';
import ScrollableTabs from './ScrollableTabs';

interface ClubhouseHeaderRedesignedProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ClubhouseHeaderRedesigned: React.FC<ClubhouseHeaderRedesignedProps> = ({
  className = "",
  activeTab,
  onTabChange
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
      const newStyle = `${currentStyle};opacity:${visible ? 1 : 0};transform:${visible ? 'translateY(0)' : 'translateY(-12px)'};pointer-events:${visible ? 'auto' : 'none'}`;
      header.setAttribute('style', newStyle);
      document.body.classList.toggle('header-hidden', !visible);
    }, { threshold: 0 });

    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Intersection Observer Sentinel */}
      <div id="clubhouse-sentinel" className="h-1 w-px" />

      {/* Header */}
      <header
        className={`sticky top-0 z-60 backdrop-blur-md transition-all duration-300 ${className}`}
        data-hides-on-scroll
        style={{ ['--header-h-mobile' as any]: '60px' }}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => navigate('/clubhouse')}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img 
                src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png" 
                alt="Golf app logo" 
                className="h-8 w-8 md:h-10 md:w-10" 
              />
              <span className="hidden sm:block text-lg font-semibold text-white">
                Golf
              </span>
            </button>
          </div>

          {/* Desktop search pill */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchPill className="w-full max-w-xl" />
          </div>

          {/* Right utilities (more spacing) */}
          <nav className="flex items-center space-x-4 md:space-x-6">
            {/* Search button (mobile) */}
            <button 
              className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Notifications */}
            <button className="p-2 text-white/80 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </button>

            {/* Profile */}
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <User className="w-6 h-6" />
            </button>

            {/* Settings */}
            <button className="p-2 text-white/80 hover:text-white transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </nav>
        </div>

        {/* Tabs */}
        {activeTab && onTabChange && (
          <div className="border-t border-white/10">
            <ScrollableTabs activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        )}
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <>
          <div 
            className="fixed inset-0 z-[65] bg-black/20 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 z-[70] p-3">
            <div className="rounded-full bg-white/7 backdrop-blur-2xl border border-white/15 shadow-[var(--hud-shadow)]">
              <SearchPill autoFocus onClose={() => setSearchOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ClubhouseHeaderRedesigned;