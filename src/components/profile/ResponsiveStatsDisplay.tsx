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
        ${isMobile ? 'min-w-[70px] flex-shrink-0' : 'flex-1'}
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
          ? 'flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1' // Mobile: horizontal scroll pill-strip
          : 'grid grid-cols-4 gap-4' // Desktop: inline with generous padding
        }
      `}>
        <PrimaryStat 
          label="Handicap" 
          value={primaryStats.handicap}
          onClick={() => onStatClick?.('handicap')}
        />
        <PrimaryStat 
          label="Posts" 
          value={primaryStats.posts}
          onClick={() => onStatClick?.('posts')}
        />
        <PrimaryStat 
          label="Followers" 
          value={primaryStats.followers}
          onClick={() => onStatClick?.('followers')}
        />
        <PrimaryStat 
          label="Following" 
          value={primaryStats.following}
          onClick={() => onStatClick?.('following')}
        />
      </div>
    </div>
  );
};

export default ResponsiveStatsDisplay;