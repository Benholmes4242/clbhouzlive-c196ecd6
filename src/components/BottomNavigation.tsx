
import React, { useState } from 'react';
import { Home, Users, MapPin, ShoppingBag, Newspaper } from 'lucide-react';

const BottomNavigation = () => {
  const [activeTab, setActiveTab] = useState('trending');

  const tabs = [
    { id: 'trending', label: 'Trending', icon: Home },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'courses', label: 'Courses', icon: MapPin },
    { id: 'marketplace', label: 'Buy/Sell', icon: ShoppingBag },
    { id: 'news', label: 'News', icon: Newspaper },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive 
                    ? 'text-green-600' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-12 h-0.5 bg-green-600 rounded-full" />
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
