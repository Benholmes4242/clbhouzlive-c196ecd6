import React from 'react';
import { Search, Bell, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const handleProfileClick = () => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/profile');
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  // Mock data for notifications and messages - in a real app, this would come from your backend
  const hasNotifications = user && false; // Set to false to show no notifications
  const notificationCount = user ? 0 : 0; // Set to 0 to show no count
  const hasMessages = user && false; // Set to false to show no messages

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
                maxHeight: "56px", // increased from 44px to make the logo a bit bigger
                maxWidth: 240,
                objectFit: "contain"
              }}
              onClick={handleLogoClick}
            />
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md w-full mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search players, courses, or content..."
                className="w-full pl-10 pr-4 py-2 bg-muted rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="h-5 w-5" />
              {hasMessages && (
                <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full h-2 w-2"></span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
