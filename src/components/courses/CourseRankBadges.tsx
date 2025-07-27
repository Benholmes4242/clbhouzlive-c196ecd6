
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

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
      icon: <Earth className="h-6 w-6 text-white" />,
      tooltip: "Worldwide Ranking"
    });
  }

  // Add regional ranking second
  if (isGBI && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Britain & Ireland" size="lg" />,
      tooltip: "GB&I Ranking"
    });
  } else if (isUSA && usaRank && usaRank <= 100) {
    rankingBadges.push({
      rank: usaRank,
      icon: <CountryFlag country="USA" size="lg" />,
      tooltip: "USA Ranking"
    });
  } else if (isEurope && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Continental Europe" size="lg" />,
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
        return 'absolute bottom-3 left-6 flex flex-row gap-2 z-10';
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
                <div className="flex items-center gap-2 px-1.5 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm" style={{ borderRadius: '8px' }}>
                  {badge.icon}
                  <span className="text-base font-bold text-white">{badge.rank}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Player rating badge - show on top-right when user rating exists */}
      {playerRatingBadge && (
        <div className="absolute top-2 right-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-1.5 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm" style={{ borderRadius: '8px' }}>
                <ClubhouseLogo size="md" />
                <span className="text-base font-bold text-white">{playerRatingBadge.content}</span>
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
