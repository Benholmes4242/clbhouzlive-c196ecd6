
import React, { useState, useEffect } from 'react';
import { Home, Compass, Trophy, Flag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  // Updated tabs - changed second tab to Explore with compass icon
  const tabs = [
    { id: 'home', label: 'Clubhouse', icon: Home, path: '/' },
    { id: 'explore', label: 'Explore', icon: Compass, path: '/explore' },
    { id: 'tour-central', label: 'Tour Central', icon: Trophy, path: '/tour-central' },
    { id: 'courses', label: 'Courses', icon: Flag, path: '/courses' },
  ];

  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/') {
      setActiveTab('home');
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
                className={`flex flex-col items-center justify-center space-y-1 transition-colors relative focus:outline-none ${
                  isActive
                    ? 'text-[#2a2626]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon 
                  className="h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2}
                />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
