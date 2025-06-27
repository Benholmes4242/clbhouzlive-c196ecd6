
import React from 'react';
import { Telescope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";

const HeaderExploreButton = () => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/explore');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 50);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleExploreClick}>
      <Telescope className="h-5 w-5" />
    </Button>
  );
};

export default HeaderExploreButton;
