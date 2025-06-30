
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from './navigationTabs';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/') {
      setActiveTab('home');
    }
  }, [location.pathname]);

  const handleTabClick = (
    tab: { id: string; path: string | null; isAction?: boolean },
    user: any,
    openSnapModal: () => void
  ) => {
    if (tab.isAction && tab.id === 'snap') {
      if (!user) return;
      openSnapModal();
    } else if (tab.path) {
      setActiveTab(tab.id);
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
