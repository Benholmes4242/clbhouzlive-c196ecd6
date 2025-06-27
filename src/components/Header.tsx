
import React from 'react';
import { useNavigate } from "react-router-dom";
import HeaderNavigation from './header/HeaderNavigation';
import HeaderUserMenu from './header/HeaderUserMenu';
import HeaderSearch from './header/HeaderSearch';

const Header = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Fixed positioning */}
          <div className="flex items-center flex-shrink-0">
            <img
              src="/lovable-uploads/071651d4-1096-4053-b720-6f758b637fb8.png"
              alt="clbhouz Logo"
              className="h-10 w-auto cursor-pointer object-contain"
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
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
