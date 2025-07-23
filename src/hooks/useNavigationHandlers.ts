
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from '@/components/bottom-navigation/navigationTabs';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('clubhouse');

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/' || location.pathname === '/clubhouse') {
      setActiveTab('clubhouse'); // Set clubhouse as active when on home page or clubhouse page
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction) {
      // Handle action tabs (like post creation)
      return;
    }

    setActiveTab(tab.id);
    
    if (tab.path) {
      navigate(tab.path);
      
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }, 50);
    }
  };

  return {
    activeTab,
    handleTabClick
  };
};
