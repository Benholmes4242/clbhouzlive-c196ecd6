import React from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import BottomNavigation from './BottomNavigation';

const GlobalBottomNavigation: React.FC = () => {
  const { isVisible, variant } = useBottomNavigation();

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[100]"
    >
      <BottomNavigation variant={variant} />
    </div>
  );
};

export default GlobalBottomNavigation;