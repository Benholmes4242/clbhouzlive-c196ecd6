import React from 'react';
import { Home, Compass, Trophy, PlusCircle, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { id: 'home', icon: Home, path: '/clubhouse' },
  { id: 'explore', icon: Compass, path: '/explore' },
  { id: 'trophies', icon: Trophy, path: '/achievements' },
  { id: 'post', icon: PlusCircle, path: null, isAction: true },
  { id: 'courses', icon: Map, path: '/courses' },
];

export const GlobalNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.isAction) {
      console.log('Open composer');
      return;
    }
    if (tab.path) navigate(tab.path);
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path === '/clubhouse' && (location.pathname === '/clubhouse' || location.pathname === '/')) {
      return true;
    }
    return location.pathname === tab.path;
  };

  return (
    <nav
      className="fixed bottom-[env(safe-area-inset-bottom,8px)] left-1/2 -translate-x-1/2 z-[90] px-3 py-2 rounded-full"
      style={{
        background: 'rgba(15, 15, 15, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'flex items-center justify-center p-2 rounded-full transition-all duration-200 hover:bg-white/10',
                active ? 'opacity-100' : 'opacity-60'
              )}
            >
              <Icon className="w-5 h-5 text-white" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
