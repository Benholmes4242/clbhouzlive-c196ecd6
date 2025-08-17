
import React from 'react';
import { useNavigate } from "react-router-dom";
import HeaderNavigation from './header/HeaderNavigation';
import HeaderSearch from './header/HeaderSearch';
import { useAppLogo } from '@/hooks/useAppLogo';

const Header = ({ bleedContent }: { bleedContent?: React.ReactNode }) => {
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  return (
    <header className="sticky top-0 z-50 overflow-hidden">
      {/* Bleed Layer - positioned absolute within sticky header with overlap and feathering */}
      {bleedContent && (
        <div 
          className="absolute inset-x-0 pointer-events-none z-40"
          style={{ 
            top: '0',
            height: 'calc(4rem + 16px)', // Add 16px overlap
            overflow: 'hidden'
          }}
          aria-hidden="true"
        >
          {/* Main bleed content with enhanced blur and slight scale */}
          <div 
            className="absolute inset-0"
            style={{
              filter: 'blur(20px) saturate(1.2) brightness(1.03)', // Enhanced blur + slight brightness adjustment
              transform: 'scale(1.06)', // Slight scale to eliminate edge artifacts
            }}
          >
            {bleedContent}
          </div>
          
          {/* Feather mask for seamless blending - alpha gradient */}
          <div 
            className="absolute inset-x-0 pointer-events-none"
            style={{
              top: '4rem', // Start fade at header bottom
              height: '16px', // 16px feather distance
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)',
              mixBlendMode: 'multiply'
            }}
          />
          
          {/* Subtle noise layer for natural texture */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
              backgroundRepeat: 'repeat',
              pointerEvents: 'none'
            }}
          />
        </div>
      )}
      
      {/* Header content with subtle translucency gradient */}
      <div 
        className="container mx-auto px-4 md:px-0 max-w-full box-border relative z-50"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, transparent 100%)'
        }}
      >
        <div className="flex items-center justify-between h-16 max-w-full">
          {/* Logo - Enlarged and optimized positioning */}
          <div className="flex items-center flex-shrink-0 gap-1 md:gap-2 py-1 min-w-0">
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="Logo Mark"
              className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={handleLogoClick}
            />
            <img
              src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
              alt="clbhouz Logo"
              className="h-10 md:h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={handleLogoClick}
            />
          </div>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-md mx-2 md:mx-4 min-w-0">
            <HeaderSearch />
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-1 md:space-x-4 flex-shrink-0 min-w-0">
            <HeaderNavigation />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
