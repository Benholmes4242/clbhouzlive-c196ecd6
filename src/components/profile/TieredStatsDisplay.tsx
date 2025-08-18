import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Trophy, Star, TrendingUp, Target, MapPin, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface TieredStatsDisplayProps {
  primaryStats: {
    handicap: string | number;
    posts: number;
    followers: number;
    following: number;
  };
  secondaryStats: {
    coursesRated: number;
    avgRating: number;
    achievements: number;
    memberSince?: string;
  };
  onStatClick?: (statType: string) => void;
}

const TieredStatsDisplay: React.FC<TieredStatsDisplayProps> = ({
  primaryStats,
  secondaryStats,
  onStatClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const PrimaryStat = ({ icon: Icon, label, value, onClick }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-background/60 hover:bg-background/80 transition-all duration-200 backdrop-blur-sm border border-border/30 ${
        isMobile ? 'min-w-[70px]' : 'min-w-[100px]'
      }`}
    >
      <Icon className="w-5 h-5 text-primary" />
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </button>
  );

  const SecondaryStat = ({ icon: Icon, label, value, onClick }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg bg-background/40 hover:bg-background/60 transition-all duration-200 backdrop-blur-sm border border-border/20"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Primary Stats - Always Visible */}
      <div className={`${
        isMobile 
          ? 'flex gap-2 overflow-x-auto scrollbar-hide pb-2' 
          : 'grid grid-cols-4 gap-4'
      }`}>
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

      {/* Expand/Collapse Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-xs font-medium mr-2">
            {isExpanded ? 'Show Less' : 'Show More Stats'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Secondary Stats - Expandable */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-2 pt-2">
          <SecondaryStat 
            icon={Target} 
            label="Courses Rated" 
            value={secondaryStats.coursesRated}
            onClick={() => onStatClick?.('coursesRated')}
          />
          <SecondaryStat 
            icon={MapPin} 
            label="Avg Rating" 
            value={secondaryStats.avgRating > 0 ? `${secondaryStats.avgRating}/5` : 'N/A'}
            onClick={() => onStatClick?.('avgRating')}
          />
          <SecondaryStat 
            icon={Award} 
            label="Achievements" 
            value={secondaryStats.achievements}
            onClick={() => onStatClick?.('achievements')}
          />
          {secondaryStats.memberSince && (
            <SecondaryStat 
              icon={Calendar} 
              label="Member Since" 
              value={secondaryStats.memberSince}
              onClick={() => onStatClick?.('memberSince')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TieredStatsDisplay;