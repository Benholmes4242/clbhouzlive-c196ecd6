/**
 * IntelligenceTabSwitcher - Premium tactile pill selector
 * Light themed with elevated active state
 */

import React from 'react';

type IntelligenceTab = 'courseDNA' | 'predictions';

interface IntelligenceTabSwitcherProps {
  activeTab: IntelligenceTab;
  onTabChange: (tab: IntelligenceTab) => void;
}

const IntelligenceTabSwitcher: React.FC<IntelligenceTabSwitcherProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: IntelligenceTab; label: string }[] = [
    { id: 'courseDNA', label: 'Course DNA' },
    { id: 'predictions', label: 'Predictions' },
  ];

  return (
    <div 
      className="flex p-1 rounded-[14px] mb-4 border border-border"
      style={{ background: '#F1F3F5' }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 py-2.5 text-center rounded-[11px] transition-all duration-300 active:scale-95"
            style={{
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#1C1917' : '#78716C',
              background: isActive ? 'hsl(var(--card))' : 'transparent',
              border: isActive ? '1px solid hsl(var(--border))' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default IntelligenceTabSwitcher;
