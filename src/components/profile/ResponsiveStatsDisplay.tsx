import React from 'react';
import { Zap, Trophy, Star, TrendingUp } from 'lucide-react';
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

  const PrimaryStat = ({ icon: Icon, label, value, onClick }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl bg-background/60 
        hover:bg-background/80 transition-all duration-200 backdrop-blur-sm 
        border border-gray-200/50 hover:border-gray-300/70 hover:scale-105
        focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
        ${isMobile ? 'min-w-[80px] flex-shrink-0' : 'flex-1'}
      `}
    >
      <Icon className="w-5 h-5 text-gray-600" />
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground font-medium text-center">{label}</div>
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
          icon={Zap} 
          label="Handicap" 
          value={primaryStats.handicap}
          onClick={() => onStatClick?.('handicap')}
        />
        <PrimaryStat 
          icon={Trophy} 
          label="Posts" 
          value={primaryStats.posts}
          onClick={() => onStatClick?.('posts')}
        />
        <PrimaryStat 
          icon={Star} 
          label="Followers" 
          value={primaryStats.followers}
          onClick={() => onStatClick?.('followers')}
        />
        <PrimaryStat 
          icon={TrendingUp} 
          label="Following" 
          value={primaryStats.following}
          onClick={() => onStatClick?.('following')}
        />
      </div>
    </div>
  );
};

export default ResponsiveStatsDisplay;