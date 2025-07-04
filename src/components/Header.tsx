
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
          {/* Logo - Fixed positioning */}
          <div className="flex items-center flex-shrink-0 gap-3">
            <img
              src={currentLogo?.file_url || "/lovable-uploads/181fd40d-ced5-420c-bff8-27c2ef146377.png"}
              alt="clbhouz Logo"
              className="h-10 w-auto cursor-pointer object-contain"
              onClick={handleLogoClick}
            />
            <img
              src="/lovable-uploads/07c8207e-a9d0-437b-a96d-8241dbf0017d.png"
              alt="Logo Mark"
              className="h-8 w-auto object-contain self-end"
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
