
import React from 'react';
import { useNavigate } from "react-router-dom";
import HeaderNavigation from './header/HeaderNavigation';
import HeaderSearch from './header/HeaderSearch';
import { useAppLogo } from '@/hooks/useAppLogo';

const Header = () => {
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Enlarged and optimized positioning */}
          <div className="flex items-center flex-shrink-0 gap-2 py-1">
            <img
              src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
              alt="Logo Mark"
              className="h-12 w-auto object-contain"
            />
            <img
              src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
              alt="clbhouz Logo"
              className="h-12 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            />
          </div>

          {/* Search Bar - Centered with proper spacing */}
          <div className="flex-1 max-w-md mx-4">
            <HeaderSearch />
          </div>

          {/* Navigation Icons - Fixed positioning */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <HeaderNavigation />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
