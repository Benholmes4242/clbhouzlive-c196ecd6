import React from 'react';

interface ShortsTabProps {
  isActive: boolean;
  onOpenShorts: () => void;
}

const ShortsTab: React.FC<ShortsTabProps> = ({ isActive, onOpenShorts }) => {
  return (
    <button
      onClick={onOpenShorts}
      className={`h-11 px-4 rounded-full text-sm font-medium transition-all shadow-sm ${
        isActive
          ? 'bg-[var(--bg-page)] text-white'
          : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
      }`}
      aria-pressed={isActive}
    >
      Shorts
    </button>
  );
};

export default ShortsTab;
