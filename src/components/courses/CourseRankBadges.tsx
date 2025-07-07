
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CourseRankBadgesProps {
  globalRank: number | null;
  regionalRank: number | null;
  usaRank: number | null;
  country: string;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
  userRating?: number | null;
  showUserRating?: boolean;
  positioning?: 'top-left' | 'bottom-left';
}

const CourseRankBadges = ({ 
  globalRank, 
  regionalRank, 
  usaRank, 
  country, 
  viewContext = 'global',
  userRating,
  showUserRating = false,
  positioning = 'top-left'
}: CourseRankBadgesProps) => {
  // Check for GB&I countries - including all possible variations
  const isGBI = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'].includes(country);
  const isUSA = ['United States', 'USA'].includes(country);
  const isEurope = country === 'Continental Europe';

  // Create array of ranking badges to display
  const rankingBadges = [];

  // Add worldwide ranking first (highest priority)
  if (globalRank && globalRank <= 100) {
    rankingBadges.push({
      rank: globalRank,
      icon: <Earth className="h-5 w-5 text-gray-600" />,
      tooltip: "Worldwide Ranking"
    });
  }

  // Add regional ranking second
  if (isGBI && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Britain & Ireland" size="md" />,
      tooltip: "GB&I Ranking"
    });
  } else if (isUSA && usaRank && usaRank <= 100) {
    rankingBadges.push({
      rank: usaRank,
      icon: <CountryFlag country="USA" size="md" />,
      tooltip: "USA Ranking"
    });
  } else if (isEurope && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Continental Europe" size="md" />,
      tooltip: "Continental Europe Ranking"
    });
  }

  // Player rating badge (separate from rankings)
  const playerRatingBadge = showUserRating && userRating !== null && userRating !== undefined ? {
    content: `${userRating}/10`,
    tooltip: "Your Rating"
  } : null;

  // Determine positioning classes
  const getPositioningClasses = () => {
    switch (positioning) {
      case 'bottom-left':
        return 'absolute bottom-3 left-3 flex flex-col gap-1 z-10';
      case 'top-left':
      default:
        return 'absolute top-2 left-2 flex flex-col gap-1 z-10';
    }
  };

  return (
    <TooltipProvider>
      {/* Ranking badges */}
      {rankingBadges.length > 0 && (
        <div className={getPositioningClasses()}>
          {rankingBadges.map((badge, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100/90 backdrop-blur-sm rounded-xl shadow-sm">
                  {badge.icon}
                  <span className="text-sm font-bold text-gray-800">{badge.rank}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Player rating badge - only show on top-right for backward compatibility */}
      {playerRatingBadge && positioning === 'top-left' && (
        <div className="absolute top-2 right-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center px-2 py-1 bg-teal-100/90 backdrop-blur-sm rounded-xl shadow-sm">
                <span className="text-sm font-bold text-teal-800">{playerRatingBadge.content}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{playerRatingBadge.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </TooltipProvider>
  );
};

export default CourseRankBadges;
