/**
 * IntelligenceTabSwitcher - Canonical Tier 2 sub-tab style
 * Orange underline, 44px tap targets, no bottom border
 */

import React from 'react';
import { motion } from 'framer-motion';

type IntelligenceTab = 'courseDNA' | 'predictions';

interface IntelligenceTabSwitcherProps {
  activeTab: IntelligenceTab;
  onTabChange: (tab: IntelligenceTab) => void;
  picksFirst?: boolean;
}

const IntelligenceTabSwitcher: React.FC<IntelligenceTabSwitcherProps> = ({
  activeTab,
  onTabChange,
  picksFirst = false,
}) => {
  const options = picksFirst
    ? [
        { label: 'Top 5 Picks', value: 'predictions' as const },
        { label: 'Course DNA', value: 'courseDNA' as const },
      ]
    : [
        { label: 'Course DNA', value: 'courseDNA' as const },
        { label: 'Top 5 Picks', value: 'predictions' as const },
      ];

  return (
    <div className="flex items-center gap-1 mb-4">
      {options.map((opt) => {
        const isActive = activeTab === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onTabChange(opt.value)}
            className={`relative px-3 py-2 min-h-[44px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${
              isActive
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground font-medium hover:text-foreground'
            }`}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {opt.label}
            {isActive && (
              <motion.div
                layoutId="intelligence-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[hsl(var(--tab-orange))]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default IntelligenceTabSwitcher;
