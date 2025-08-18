import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Target, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProfileStatsProps {
  stats: {
    handicap: string | number;
    posts: number;
    followers: number;
    following: number;
  };
  secondaryStats?: {
    coursesRated?: number;
    avgRating?: number;
    achievements?: number;
    totalRounds?: number;
  };
  isMobile?: boolean;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  stats, 
  secondaryStats = {},
  isMobile = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryStats = [
    { 
      label: 'Handicap', 
      value: stats.handicap, 
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400' 
    },
    { 
      label: 'Posts', 
      value: stats.posts, 
      icon: null,
      color: 'text-green-600 dark:text-green-400' 
    },
    { 
      label: 'Followers', 
      value: stats.followers, 
      icon: null,
      color: 'text-purple-600 dark:text-purple-400' 
    },
    { 
      label: 'Following', 
      value: stats.following, 
      icon: null,
      color: 'text-orange-600 dark:text-orange-400' 
    }
  ];

  const secondaryStatsArray = [
    { 
      label: 'Courses Rated', 
      value: secondaryStats.coursesRated || 0, 
      icon: MapPin,
      color: 'text-teal-600 dark:text-teal-400' 
    },
    { 
      label: 'Avg Rating', 
      value: secondaryStats.avgRating ? `${secondaryStats.avgRating}/5` : 'N/A', 
      icon: Star,
      color: 'text-yellow-600 dark:text-yellow-400' 
    },
    { 
      label: 'Achievements', 
      value: secondaryStats.achievements || 0, 
      icon: Trophy,
      color: 'text-red-600 dark:text-red-400' 
    },
    { 
      label: 'Total Rounds', 
      value: secondaryStats.totalRounds || 0, 
      icon: null,
      color: 'text-indigo-600 dark:text-indigo-400' 
    }
  ];

  if (isMobile) {
    return (
      <div className="w-full">
        {/* Primary Stats - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {primaryStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 min-w-[100px]"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  {IconComponent && <IconComponent className={`w-4 h-4 ${stat.color}`} />}
                  <span className="text-white/80 text-xs font-medium">{stat.label}</span>
                </div>
                <div className="text-center">
                  <span className="text-white font-bold text-lg">{stat.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Secondary Stats */}
        {Object.keys(secondaryStats).length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <span className="mr-2">More Stats</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {secondaryStatsArray.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {IconComponent && <IconComponent className={`w-3 h-3 ${stat.color}`} />}
                        <span className="text-white/80 text-xs">{stat.label}</span>
                      </div>
                      <span className="text-white font-semibold text-sm">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="w-full">
      {/* Primary Stats - Inline */}
      <div className="flex items-center justify-center gap-8 mb-6">
        {primaryStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {IconComponent && <IconComponent className={`w-5 h-5 ${stat.color}`} />}
                <span className="text-white/80 text-sm font-medium">{stat.label}</span>
              </div>
              <span className="text-white font-bold text-2xl">{stat.value}</span>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats - Expandable */}
      {Object.keys(secondaryStats).length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mx-auto block text-white/70 hover:text-white hover:bg-white/10"
            >
              <span className="mr-2">Advanced Stats</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex items-center justify-center gap-6 mt-4">
              {secondaryStatsArray.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {IconComponent && <IconComponent className={`w-4 h-4 ${stat.color}`} />}
                      <span className="text-white/80 text-xs font-medium">{stat.label}</span>
                    </div>
                    <span className="text-white font-semibold text-lg">{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default ProfileStats;