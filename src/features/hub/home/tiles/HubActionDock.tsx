/**
 * HubActionDock - Bottom navigation bar for Hub
 * Matches the site-wide bottom nav styling
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Bot, Camera, User } from 'lucide-react';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface HubNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  external?: boolean;
}

const hubNavItems: HubNavItem[] = [
  { id: 'home', label: 'Home', icon: HomeIcon, path: '/clubhouse', external: true },
  { id: 'game', label: 'Game', icon: Plus, path: '/hub/create-game' },
  { id: 'echo', label: 'Echo', icon: Bot, path: '/hub/echo' },
  { id: 'moment', label: 'Moment', icon: Camera, path: '/create-moment' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile', external: true },
];

export function HubActionDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateFromHub, close } = useHub();

  const handleItemClick = (item: HubNavItem) => {
    haptic('light');
    if (item.external) {
      close();
      navigate(item.path);
    } else {
      navigateFromHub(item.path);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[10000] bottom-nav-fixed border-t border-slate-200/60"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(248, 250, 252, 0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 -1px 12px rgba(0, 0, 0, 0.04), 0 -4px 24px rgba(0, 0, 0, 0.02)',
      }}
    >
      <nav className="w-full h-[55px] flex items-center justify-around">
        {hubNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1",
                "transition-transform duration-[120ms] ease-out",
                "active:scale-95",
                "focus:outline-none"
              )}
              aria-label={item.label}
            >
              <Icon 
                className={cn(
                  "h-[26px] w-[26px] transition-colors duration-300",
                  "[stroke-width:1.5]",
                  active 
                    ? "text-slate-800 opacity-100" 
                    : "text-slate-500 opacity-90"
                )}
              />
              
              <span 
                className={cn(
                  "text-[10px] leading-none transition-colors duration-300",
                  active 
                    ? "text-slate-800" 
                    : "text-slate-500"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
