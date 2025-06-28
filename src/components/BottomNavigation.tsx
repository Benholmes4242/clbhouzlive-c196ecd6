
import React, { useState, useEffect } from 'react';
import { Home, Building2, Trophy, Flag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  // Updated tabs - removed the post button
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'clubhouse', label: 'Clubhouse', icon: Building2, path: '/clubhouse' },
    { id: 'tour-central', label: 'Tour Central', icon: Trophy, path: '/tour-central' },
    { id: 'courses', label: 'Courses', icon: Flag, path: '/courses' },
  ];

  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.path) {
      setActiveTab(tab.id);
      navigate(tab.path);
      
      // Scroll to top on tab navigation
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }, 50);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16 relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors relative group ${
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'fill-current' : ''} ${!isActive ? 'group-hover:text-black dark:group-hover:text-white' : ''}`} />
                <span className={`text-xs font-medium ${!isActive ? 'group-hover:text-black dark:group-hover:text-white' : ''}`}>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-12 h-0.5 bg-black dark:bg-white rounded-full left-1/2 -translate-x-1/2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
