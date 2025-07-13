import React from 'react';
import { Camera, Search, Home, Trophy, MapPin } from 'lucide-react';

interface NeonNavigationBarProps {
  activeTab: string;
  onTabClick: (tab: { id: string; path: string | null; isAction?: boolean }) => void;
}

const NeonNavigationBar: React.FC<NeonNavigationBarProps> = ({ activeTab, onTabClick }) => {
  const navigationTabs = [
    { id: 'home', label: 'Clubhouse', icon: Home, path: '/' },
    { id: 'explore', label: 'Explore', icon: Search, path: '/explore' },
    { id: 'post', label: 'Post', icon: Camera, path: null, isAction: true },
    { id: 'tour', label: 'Tour Central', icon: Trophy, path: '/tour-central' },
    { id: 'courses', label: 'Courses', icon: MapPin, path: '/courses' },
  ];

  return (
    <nav className="neon-navbar">
      {/* Logo/Brand on the left */}
      <div className="neon-item logo">
        <div className="neon-logo">
          <span className="logo-text">clbhouz</span>
        </div>
      </div>

      {/* Regular navigation items */}
      {navigationTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isPostButton = tab.id === 'post';

        if (isPostButton) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab)}
              className="neon-item central-post"
            >
              <Icon className="post-icon" />
              <span className="neon-label">Post</span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab)}
            className={`neon-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="neon-icon" />
            <span className="neon-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default NeonNavigationBar;