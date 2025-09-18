import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import HeaderNavigation from '../header/HeaderNavigation';
import { useAppLogo } from '@/hooks/useAppLogo';

const CompactHeader = () => {
  const navigate = useNavigate();
  const { currentLogo } = useAppLogo();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleLogoClick = () => {
    navigate('/clubhouse');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log('Search:', searchValue);
    setSearchOpen(false);
  };

  return (
    <div className="flex items-center justify-between h-16 max-w-full">
      {/* Logo - Orange mark + White text */}
      <div className="flex items-center flex-shrink-0 gap-1 py-1 min-w-0">
        <img
          src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
          alt="Logo Mark"
          className="h-8 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0 compact-icon-size"
          onClick={handleLogoClick}
        />
        <img
          src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
          alt="clbhouz Logo"
          className="h-8 w-auto cursor-pointer object-contain hover:opacity-80 transition-opacity flex-shrink-0 compact-icon-size brightness-0 invert"
          onClick={handleLogoClick}
        />
      </div>

      {/* Search Icon - Opens overlay in compact mode */}
      <div className="flex-1 flex justify-center min-w-0">
        <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              aria-label="Search"
            >
              <Search className="h-5 w-5 compact-icon-size" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="h-auto">
            <form onSubmit={handleSearchSubmit} className="mt-6">
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search..."
                className="w-full"
                autoFocus
              />
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Navigation Icons - Compact layout */}
      <div className="flex items-center space-x-1 flex-shrink-0 min-w-0">
        <HeaderNavigation />
      </div>
    </div>
  );
};

export default CompactHeader;