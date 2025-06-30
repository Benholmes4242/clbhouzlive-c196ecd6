
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
}

const CourseRankBadges = ({ 
  globalRank, 
  regionalRank, 
  usaRank, 
  country, 
  viewContext = 'global',
  userRating,
  showUserRating = false
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
      icon: <Earth className="h-4 w-4 text-blue-600 flex-shrink-0" />,
      tooltip: "Worldwide Ranking"
    });
  }

  // Add regional ranking second
  if (isGBI && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Britain & Ireland" size="md" className="flex-shrink-0" />,
      tooltip: "GB&I Ranking"
    });
  } else if (isUSA && usaRank && usaRank <= 100) {
    rankingBadges.push({
      rank: usaRank,
      icon: <CountryFlag country="USA" size="md" className="flex-shrink-0" />,
      tooltip: "USA Ranking"
    });
  } else if (isEurope && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Continental Europe" size="md" className="flex-shrink-0" />,
      tooltip: "Continental Europe Ranking"
    });
  }

  // Player rating badge (separate from rankings)
  const playerRatingBadge = showUserRating && userRating !== null && userRating !== undefined ? {
    content: `${userRating}/10`,
    tooltip: "Your Rating"
  } : null;

  return (
    <TooltipProvider>
      {/* Left side: Ranking badges (stacked vertically) */}
      {rankingBadges.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {rankingBadges.map((badge, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-100/90 backdrop-blur-sm rounded-xl shadow-sm min-w-[52px]">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {badge.icon}
                  </div>
                  <span className="text-sm font-bold text-gray-800 leading-none">{badge.rank}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Right side: Player rating badge */}
      {playerRatingBadge && (
        <div className="absolute top-2 right-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center px-2.5 py-1.5 bg-teal-100/90 backdrop-blur-sm rounded-xl shadow-sm">
                <span className="text-sm font-bold text-teal-800 leading-none">{playerRatingBadge.content}</span>
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
