import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveStatsDisplayProps {
  primaryStats: {
    handicap: string | number;
    posts: number;
    followers: number;
    following: number;
  };
  onStatClick?: (statType: string) => void;
}

const ResponsiveStatsDisplay: React.FC<ResponsiveStatsDisplayProps> = ({
  primaryStats,
  onStatClick
}) => {
  const isMobile = useIsMobile();

  const PrimaryStat = ({ label, value, onClick }: {
    label: string;
    value: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 p-3 rounded-lg bg-white/80 
        hover:bg-white/90 transition-all duration-200 backdrop-blur-sm 
        border border-gray-200 hover:border-gray-300 hover:scale-105
        ${isMobile ? 'w-full' : 'flex-1'}
      `}
    >
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 font-medium text-center">{label}</div>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Primary Stats */}
      <div className={`
        ${isMobile 
          ? 'grid grid-cols-4 gap-3 w-full' // Mobile: centered grid using full viewport width
          : 'grid grid-cols-4 gap-4' // Desktop: existing layout
        }
      `}>
        <PrimaryStat 
          label="Posts" 
          value={primaryStats.posts}
          onClick={() => onStatClick?.('posts')}
        />
        <PrimaryStat 
          label="Total XP" 
          value={primaryStats.handicap}
          onClick={() => onStatClick?.('handicap')}
        />
        <PrimaryStat 
          label="Following" 
          value={primaryStats.following}
          onClick={() => onStatClick?.('following')}
        />
        <PrimaryStat 
          label="Followers" 
          value={primaryStats.followers}
          onClick={() => onStatClick?.('followers')}
        />
      </div>
    </div>
  );
};

export default ResponsiveStatsDisplay;