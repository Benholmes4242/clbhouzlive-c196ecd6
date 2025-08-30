
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import XPBadge from '@/components/ui/xp-badge';

interface CourseRankBadgesProps {
  globalRank: number | null;
  regionalRank: number | null;
  usaRank: number | null;
  country: string;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
  userRating?: number | null;
  showUserRating?: boolean;
  averageRating?: number | null;
  showAverageRating?: boolean;
  positioning?: 'top-left' | 'bottom-left';
  xp?: number;
  showXP?: boolean;
}

const CourseRankBadges = ({ 
  globalRank, 
  regionalRank, 
  usaRank, 
  country, 
  viewContext = 'global',
  userRating,
  showUserRating = false,
  averageRating,
  showAverageRating = false,
  positioning = 'top-left',
  xp,
  showXP = false
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
      icon: <Earth className="h-5 w-5 text-white" />,
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

  // Add Clubhouse rating badge right after regional badge
  if (showAverageRating && averageRating !== null && averageRating !== undefined) {
    rankingBadges.push({
      rank: averageRating.toFixed(1),
      icon: <ClubhouseLogo size="sm" />,
      tooltip: "Community Rating"
    });
  }

  // Player rating badge (separate from rankings) - remove star emoji, just use numbers
  const playerRatingBadge = showUserRating && userRating !== null && userRating !== undefined ? {
    content: `${userRating}/10`,
    tooltip: "Your Rating"
  } : null;

  // Average course rating badge (clbhouzrating)
  const averageRatingBadge = showAverageRating && averageRating !== null && averageRating !== undefined ? {
    content: `${averageRating.toFixed(1)}`,
    tooltip: "Community Rating"
  } : null;

  // Determine positioning classes
  const getPositioningClasses = () => {
    switch (positioning) {
      case 'bottom-left':
        return 'absolute bottom-3 left-4 flex flex-row gap-2 z-10';
      case 'top-left':
      default:
        return 'absolute top-2 left-2 flex flex-row items-center gap-1.5 z-10';
    }
  };

  return (
    <TooltipProvider>
      {/* Ranking badges with integrated player rating and average rating */}
      {(rankingBadges.length > 0 || playerRatingBadge || averageRatingBadge) && (
        <div className={getPositioningClasses()}>
          {rankingBadges.map((badge, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="relative flex items-center justify-center px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  <div className="relative z-10 flex items-center justify-center gap-1.5">
                    {badge.icon}
                    <span className="text-sm font-bold text-white flex items-center">{badge.rank}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
           
           {/* Add Clubhouse rating badge */}
           {playerRatingBadge && (
             <Tooltip>
               <TooltipTrigger asChild>
                     <div className="relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                      <div className="relative z-10 flex items-center justify-center gap-1.5">
                        <ClubhouseLogo size="sm" />
                        <span className="text-sm font-bold text-white flex items-center">{playerRatingBadge.content}</span>
                      </div>
                    </div>
               </TooltipTrigger>
               <TooltipContent>
                 <p>{playerRatingBadge.tooltip}</p>
               </TooltipContent>
             </Tooltip>
           )}

           {/* Add XP badge to the right */}
           {showXP && xp && (
             <Tooltip>
               <TooltipTrigger asChild>
                 <div>
                   <XPBadge xp={xp} size="sm" />
                 </div>
               </TooltipTrigger>
               <TooltipContent>
                 <p>Experience Points Earned</p>
               </TooltipContent>
             </Tooltip>
           )}
        </div>
      )}

      {/* Player rating badge - standalone when no rankings */}
      {playerRatingBadge && rankingBadges.length === 0 && (
        <div className="absolute top-2 left-2">
          <Tooltip>
            <TooltipTrigger asChild>
               <div className="relative flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                 <div className="relative z-10 flex items-center justify-center gap-1.5">
                   <ClubhouseLogo size="sm" />
                   <span className="text-sm font-bold text-white flex items-center">{playerRatingBadge.content}</span>
                 </div>
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
