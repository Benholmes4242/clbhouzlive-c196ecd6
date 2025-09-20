import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';
import SearchPill from './SearchPill';
import { cn } from '@/lib/utils';

const ClubhouseHeaderRedesigned = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  // Fade-away logic (attach once on page mount)
  useEffect(() => {
    const header = document.querySelector('[data-hides-on-scroll]');
    const sentinel = document.getElementById('clubhouse-sentinel');
    
    if (!header || !sentinel) return;
    
    const io = new IntersectionObserver(([e]) => {
      const visible = e.isIntersecting;
      const currentStyle = header.getAttribute('style') || '';
      const baseStyle = currentStyle.split(';').filter(s => 
        !s.includes('opacity') && !s.includes('transform') && !s.includes('pointer-events')
      ).join(';');
      
      header.setAttribute('style', 
        `${baseStyle};opacity:${visible ? 1 : 0};transform:${visible ? 'translateY(0)' : 'translateY(-12px)'};pointer-events:${visible ? 'auto' : 'none'}`
      );
      document.body.classList.toggle('header-hidden', !visible);
    }, { threshold: 0 });
    
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Header (sticky + fade-away) */}
      <header
        className="sticky top-0 z-[60] backdrop-blur-md transition-all duration-300"
        data-hides-on-scroll
        style={{ '--header-h-mobile': '60px' } as React.CSSProperties}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">Clubhouse</span>
          </div>

          {/* Desktop search pill */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchPill className="w-full max-w-xl" />
          </div>

          {/* Right utilities (more spacing) */}
          <nav className="flex items-center space-x-4 md:space-x-6">
            {/* search button (mobile), bell, profile, settings */}
            <button 
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <User className="h-5 w-5" />
            </button>
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </nav>
        </div>
        
        {/* Sentinel for fade-away detection - positioned at bottom of header */}
        <div id="clubhouse-sentinel" className="h-1 w-px absolute bottom-0 left-0"></div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-x-0 top-0 z-[70] p-3">
          <div 
            className="rounded-full backdrop-blur-2xl border shadow-[var(--hud-shadow)]"
            style={{
              backgroundColor: 'hsl(var(--hud-bg))',
              borderColor: 'hsl(var(--hud-border))'
            }}
          >
            <SearchPill 
              autoFocus 
              onClose={() => setSearchOpen(false)} 
              className="bg-transparent border-0"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ClubhouseHeaderRedesigned;