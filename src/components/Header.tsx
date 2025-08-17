
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
      {/* Bleed Layer - positioned absolute within sticky header */}
      {bleedContent && (
        <div 
          className="absolute inset-x-0 top-0 pointer-events-none z-40"
          style={{ height: '4rem' }}
          aria-hidden="true"
        >
          {bleedContent}
        </div>
      )}
      
      <div className="container mx-auto px-4 md:px-0 max-w-full box-border bg-transparent relative z-50">
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
