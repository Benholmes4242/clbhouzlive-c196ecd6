
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigationHandlers = () => {
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }, user: any, callback: () => void) => {
    if (tab.isAction) {
      // Handle action tabs (like post creation)
      callback();
      return;
    }

    setActiveTab(tab.id);
    
    if (tab.path) {
      navigate(tab.path);
    }
  };

  return {
    activeTab,
    handleTabClick
  };
};
