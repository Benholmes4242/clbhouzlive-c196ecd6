import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import NavigationBar from './bottom-navigation/NavigationBar';

const BottomNavigation: React.FC = () => {
  const { user } = useSupabaseSession();
  const { activeTab, handleTabClick } = useNavigationHandlers();

  const handleTabAction = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    handleTabClick(tab, user, () => {
      // Handle post action - for now just console log since posting is simplified
      console.log('Post action triggered');
    });
  };

  return (
    <NavigationBar
      activeTab={activeTab}
      onTabClick={handleTabAction}
    />
  );
};

export default BottomNavigation;