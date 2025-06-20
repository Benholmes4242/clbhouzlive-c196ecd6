
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
              src="/lovable-uploads/f08cf816-2bf3-41e0-b02e-078c45f51c9c.png"
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
