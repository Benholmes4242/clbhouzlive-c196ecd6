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
    <div className="flex bg-slate-100 rounded-xl p-[3px] mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all duration-250 tracking-tight ${
            activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default IntelligenceTabSwitcher;
