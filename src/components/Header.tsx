
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
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/lovable-uploads/1e74af6c-d153-4197-a52b-5bf76a943867.png"
              alt="clbhouz Logo"
              className="w-auto cursor-pointer"
              style={{
                display: "block",
                maxHeight: "56px",
                maxWidth: 240,
                objectFit: "contain"
              }}
              onClick={handleLogoClick}
            />
          </div>

          {/* Search Bar */}
          <HeaderSearch />

          {/* Navigation Icons */}
          <div className="flex items-center space-x-4">
            <HeaderNavigation />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
