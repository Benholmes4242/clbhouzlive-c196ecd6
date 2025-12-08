import React from 'react';
import { cn } from '@/lib/utils';
import { getRegionTheme, type RegionKey } from '@/lib/globalAchievementMilestoneSystem';

// Map scope slugs to RegionKey for theme lookup
const SCOPE_TO_REGION: Record<string, RegionKey> = {
  'global': 'WORLD',
  'gb-i': 'GBI',
  'usa': 'USA',
  'europe': 'EUROPE',
};

interface RegionFilterPillProps {
  label: string;
  /** Scope slug: 'global' | 'gb-i' | 'usa' | 'europe' */
  scope: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * RegionFilterPill - Filter pill with regional color theming
 * Uses the global achievement/milestone system for consistent colors
 */
export const RegionFilterPill: React.FC<RegionFilterPillProps> = ({
  label,
  scope,
  active = false,
  onClick,
  className,
}) => {
  const regionKey = SCOPE_TO_REGION[scope] || 'WORLD';
  const theme = getRegionTheme(regionKey);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-4 py-2 text-sm',
        'shadow-sm transition-colors flex-1 justify-center',
        active
          ? ''
          : 'bg-white text-slate-600 hover:text-slate-800',
        className
      )}
      style={
        active
          ? {
              backgroundColor: theme.bgLight,
              color: theme.accent,
            }
          : undefined
      }
    >
      <span className="font-medium">{label}</span>
      {active && (
        <span
          className="ml-2 h-2 w-2 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      )}
    </button>
  );
};

export default RegionFilterPill;
