import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Users, FileText, Trophy, Target, Star, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TieredStatsDisplayProps {
  primaryStats: {
    handicap?: number;
    posts: number;
    followers: number;
    following: number;
  };
  secondaryStats: {
    coursesRated: number;
    averageRating: number;
    achievements: number;
    coursesPlayed: number;
  };
}

const TieredStatsDisplay: React.FC<TieredStatsDisplayProps> = ({
  primaryStats,
  secondaryStats
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const primaryStatsData = [
    {
      key: 'handicap',
      label: 'Handicap',
      value: primaryStats.handicap || '--',
      icon: Target,
      color: 'text-green-400'
    },
    {
      key: 'posts',
      label: 'Posts',
      value: primaryStats.posts,
      icon: FileText,
      color: 'text-blue-400'
    },
    {
      key: 'followers',
      label: 'Followers',
      value: primaryStats.followers,
      icon: Users,
      color: 'text-purple-400'
    },
    {
      key: 'following',
      label: 'Following',
      value: primaryStats.following,
      icon: Users,
      color: 'text-pink-400'
    }
  ];

  const secondaryStatsData = [
    {
      key: 'coursesRated',
      label: 'Courses Rated',
      value: secondaryStats.coursesRated,
      icon: Star,
      color: 'text-yellow-400'
    },
    {
      key: 'averageRating',
      label: 'Avg Rating',
      value: secondaryStats.averageRating.toFixed(1),
      icon: Trophy,
      color: 'text-orange-400'
    },
    {
      key: 'achievements',
      label: 'Achievements',
      value: secondaryStats.achievements,
      icon: Trophy,
      color: 'text-red-400'
    },
    {
      key: 'coursesPlayed',
      label: 'Courses Played',
      value: secondaryStats.coursesPlayed,
      icon: MapPin,
      color: 'text-indigo-400'
    }
  ];

  if (isMobile) {
    return (
      <div className="w-full">
        {/* Primary Stats - Horizontal Scroll Pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {primaryStatsData.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.key}
                className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  <div className="text-white text-sm">
                    <span className="font-semibold">{stat.value}</span>
                    <span className="ml-1 text-white/70 text-xs">{stat.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Secondary Stats */}
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            {isExpanded ? 'Less Stats' : 'More Stats'}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>

          {isExpanded && (
            <div className="mt-2 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {secondaryStatsData.map((stat) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={stat.key}
                    className="flex-shrink-0 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${stat.color}`} />
                      <div className="text-white text-sm">
                        <span className="font-semibold">{stat.value}</span>
                        <span className="ml-1 text-white/70 text-xs">{stat.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="w-full">
      {/* Primary Stats - Inline with spacing */}
      <div className="flex items-center justify-center gap-8 mb-4">
        {primaryStatsData.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.key} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <IconComponent className={`w-5 h-5 ${stat.color}`} />
                <span className="text-white font-bold text-xl">{stat.value}</span>
              </div>
              <div className="text-white/70 text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats - Expandable */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/80 hover:text-white hover:bg-white/10"
        >
          {isExpanded ? 'Less Stats' : 'More Stats'}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </Button>

        {isExpanded && (
          <div className="mt-4 flex items-center justify-center gap-6">
            {secondaryStatsData.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.key} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-white font-semibold text-lg">{stat.value}</span>
                  </div>
                  <div className="text-white/70 text-xs">{stat.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TieredStatsDisplay;