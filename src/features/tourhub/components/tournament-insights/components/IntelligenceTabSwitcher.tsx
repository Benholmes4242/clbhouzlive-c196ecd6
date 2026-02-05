/**
 * IntelligenceTabSwitcher - Premium tactile pill selector
 * Dark themed with weighted active state
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
      className="flex p-1 rounded-[14px] mb-4"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 py-2.5 text-sm text-center rounded-[11px] transition-all duration-300"
            style={{
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'white' : 'rgba(255, 255, 255, 0.4)',
              background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
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
