
import React from 'react';
import { useNavigate } from "react-router-dom";
import HeaderNavigation from './header/HeaderNavigation';
import HeaderUserMenu from './header/HeaderUserMenu';

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
              src="/lovable-uploads/51e72efc-b6f0-4596-a139-348c49c1168e.png"
              alt="Members Logo"
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
