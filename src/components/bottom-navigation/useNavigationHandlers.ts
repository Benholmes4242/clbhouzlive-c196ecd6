
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationTabs } from './navigationTabs';

export const useNavigationHandlers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('clubhouse');

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/' || location.pathname === '/clubhouse') {
      setActiveTab('clubhouse');
    } else if (location.pathname.startsWith('/hub')) {
      // Keep hub icon active for all /hub/* routes
      setActiveTab('hub');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    console.log('useNavigationHandlers: handleTabClick called with:', tab);
    
    if (tab.isAction) {
      console.log('useNavigationHandlers: Action tab detected, not handling navigation');
      // Action tabs are handled by the parent component (BottomNavigation)
      return;
    }

    if (tab.path) {
      console.log('useNavigationHandlers: Navigating to:', tab.path);
      setActiveTab(tab.id);
      navigate(tab.path);
      
      // Only scroll to top when navigating to different pages, not when staying on profile or hub
      if (tab.path !== '/profile' && !tab.path?.startsWith('/hub')) {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }, 50);
      }
    }
  };

  return {
    activeTab,
    handleTabClick
  };
};
