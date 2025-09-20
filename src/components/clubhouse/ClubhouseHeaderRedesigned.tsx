import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';
import SearchPill from './SearchPill';

interface ClubhouseHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ClubhouseHeaderRedesigned = ({ activeTab, onTabChange }: ClubhouseHeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);

  // Header fade-away logic
  useEffect(() => {
    const header = document.querySelector('[data-hides-on-scroll]');
    const sentinel = document.getElementById('clubhouse-sentinel');
    
    if (!header || !sentinel) return;
    
    const io = new IntersectionObserver(([e]) => {
      const visible = e.isIntersecting;
      const headerEl = header as HTMLElement;
      headerEl.style.opacity = visible ? '1' : '0';
      headerEl.style.transform = visible ? 'translateY(0)' : 'translateY(-12px)';
      headerEl.style.pointerEvents = visible ? 'auto' : 'none';
      document.body.classList.toggle('header-hidden', !visible);
    }, { threshold: 0 });
    
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-60 backdrop-blur-md transition-all duration-300"
        data-hides-on-scroll
        style={{ '--header-h-mobile': '60px' } as React.CSSProperties}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[hsl(var(--accent))] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">SC</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">SwingCoach</span>
          </div>

          {/* Desktop search pill */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchPill className="w-full max-w-xl" />
          </div>

          {/* Right utilities */}
          <nav className="flex items-center space-x-4 md:space-x-6">
            <button 
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors" 
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <User className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </nav>
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

      {/* Sentinel for scroll detection */}
      <div id="clubhouse-sentinel" className="h-1 w-px" />
    </>
  );
};

export default ClubhouseHeaderRedesigned;