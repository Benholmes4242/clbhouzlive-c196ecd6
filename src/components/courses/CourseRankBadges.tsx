
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import XPBadge from '@/components/ui/xp-badge';
import { useIsMobile } from '@/hooks/use-mobile';

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
  positioning?: 'top-left' | 'bottom-left' | 'top-right';
  xp?: number;
  showXP?: boolean;
  splitBadges?: boolean;
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
  showXP = false,
  splitBadges = false
}: CourseRankBadgesProps) => {
  const [openTooltips, setOpenTooltips] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Mobile tooltip handling
  const handleTooltipToggle = (tooltipId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setOpenTooltips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tooltipId)) {
        newSet.delete(tooltipId);
      } else {
        newSet.clear(); // Close other tooltips
        newSet.add(tooltipId);
      }
      return newSet;
    });
  };

  // Close tooltips when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenTooltips(new Set());
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
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
      tooltip: "Worldwide Rating"
    });
  }

  // Add regional ranking second
  if (isGBI && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Britain & Ireland" size="md" />,
      tooltip: "GB&I Rating"
    });
  } else if (isUSA && usaRank && usaRank <= 100) {
    rankingBadges.push({
      rank: usaRank,
      icon: <CountryFlag country="USA" size="md" />,
      tooltip: "USA Rating"
    });
  } else if (isEurope && regionalRank && regionalRank <= 100) {
    rankingBadges.push({
      rank: regionalRank,
      icon: <CountryFlag country="Continental Europe" size="md" />,
      tooltip: "Continental Europe Rating"
    });
  }

  // Add Clubhouse rating badge right after regional badge
  if (showAverageRating && averageRating !== null && averageRating !== undefined) {
    rankingBadges.push({
      rank: averageRating.toFixed(1),
      icon: <ClubhouseLogo size="sm" />,
      tooltip: "Clbhouz Community Rating"
    });
  }

  // Player rating badge (separate from rankings) - add star emoji
  const playerRatingBadge = showUserRating && userRating !== null && userRating !== undefined ? {
    content: `⭐ ${userRating}/10`,
    tooltip: "Your Rating"
  } : null;

  // Average course rating badge (clbhouzrating)
  const averageRatingBadge = showAverageRating && averageRating !== null && averageRating !== undefined ? {
    content: `${averageRating.toFixed(1)}`,
    tooltip: "Clbhouz Community Rating"
  } : null;

  // Determine positioning classes
  const getPositioningClasses = () => {
    switch (positioning) {
      case 'bottom-left':
        return 'absolute bottom-3 left-4 flex flex-row gap-2 z-10';
      case 'top-right':
        return 'absolute top-2 right-2 flex flex-row items-center gap-1.5 z-10';
      case 'top-left':
      default:
        return 'absolute top-2 left-2 flex flex-row items-center gap-1.5 z-10';
    }
  };

  // When splitBadges is true, separate ranking badges (left) from rating badges (right)
  if (splitBadges) {
    // Left side: Only ranking badges (worldwide, regional) - NO average rating
    const rankingBadgesOnly = rankingBadges.filter(badge => 
      badge.tooltip !== "Clbhouz Community Rating"
    );
    
    // Right side: Both average rating and user rating
    const ratingBadgesOnly = [
      // Add average rating badge first
      ...(showAverageRating && averageRating ? [{
        content: `${averageRating.toFixed(1)}`,
        tooltip: "Clbhouz Community Rating",
        icon: <ClubhouseLogo size="sm" />
      }] : []),
      // Add user rating badge
      ...(showUserRating && userRating ? [{ 
        content: `⭐ ${userRating}/10`, 
        tooltip: "Your Rating",
        icon: null 
      }] : [])
    ];
    
    return (
      <TooltipProvider>
        {/* Left cluster: Ranking badges only (globe, flags) */}
        {rankingBadgesOnly.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 [--badge-w:52px] md:[--badge-w:56px] lg:[--badge-w:56px]">
            {rankingBadgesOnly.map((badge, index) => {
              const tooltipId = `left-${index}`;
              return (
                <Tooltip key={index} open={openTooltips.has(tooltipId)}>
                  <TooltipTrigger asChild>
                  <div 
                    className="glass-badge-tight shadow-lg cursor-pointer" 
                    onClick={(e) => handleTooltipToggle(tooltipId, e)}
                    onTouchEnd={(e) => handleTooltipToggle(tooltipId, e)}
                  >
                    {badge.icon}
                    <span className="text-white">{badge.rank}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badge.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

        {/* Right cluster: Rating badges (average + user ratings) */}
        {ratingBadgesOnly.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10 [--badge-w:52px] md:[--badge-w:56px] lg:[--badge-w:56px]">
            {ratingBadgesOnly.map((badge, index) => {
              const tooltipId = `right-${index}`;
              const isUserRating = !badge.icon; // User rating badge has no icon
              return (
                <Tooltip key={index} open={openTooltips.has(tooltipId)}>
                  <TooltipTrigger asChild>
                    <div 
                      className="glass-badge-tight shadow-lg cursor-pointer" 
                      onClick={(e) => handleTooltipToggle(tooltipId, e)}
                      onTouchEnd={(e) => handleTooltipToggle(tooltipId, e)}
                    >
                        {badge.icon}
                        <span className="text-white">{badge.content}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badge.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      {/* Ranking badges with integrated player rating and average rating */}
      {(rankingBadges.length > 0 || playerRatingBadge || averageRatingBadge) && (
        <div className={`${getPositioningClasses()} [--badge-w:52px] md:[--badge-w:56px] lg:[--badge-w:56px]`}>
          {rankingBadges.map((badge, index) => {
            const tooltipId = `main-${index}`;
            return (
              <Tooltip key={index} open={openTooltips.has(tooltipId)}>
                <TooltipTrigger asChild>
                  <div 
                    className="glass-badge-tight shadow-lg cursor-pointer" 
                    onClick={(e) => handleTooltipToggle(tooltipId, e)}
                    onTouchEnd={(e) => handleTooltipToggle(tooltipId, e)}
                  >
                    {badge.icon}
                    <span className="text-white">{badge.rank}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{badge.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
           
           {/* Add Clubhouse rating badge */}
           {playerRatingBadge && (
             <Tooltip open={openTooltips.has('player-rating')}>
               <TooltipTrigger asChild>
                      <div 
                        className="glass-badge-tight shadow-lg cursor-pointer" 
                        onClick={(e) => handleTooltipToggle('player-rating', e)}
                        onTouchEnd={(e) => handleTooltipToggle('player-rating', e)}
                      >
                        <ClubhouseLogo size="sm" />
                        <span className="text-white">{playerRatingBadge.content}</span>
                     </div>
               </TooltipTrigger>
               <TooltipContent>
                 <p>{playerRatingBadge.tooltip}</p>
               </TooltipContent>
             </Tooltip>
           )}

           {/* Add XP badge to the right */}
           {showXP && xp && (
             <Tooltip open={openTooltips.has('xp-badge')}>
               <TooltipTrigger asChild>
                 <div
                   className="cursor-pointer"
                   onClick={(e) => handleTooltipToggle('xp-badge', e)}
                   onTouchEnd={(e) => handleTooltipToggle('xp-badge', e)}
                 >
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
        <div className="absolute top-2 left-2 [--badge-w:52px] md:[--badge-w:56px] lg:[--badge-w:56px]">
          <Tooltip open={openTooltips.has('standalone-rating')}>
            <TooltipTrigger asChild>
               <div 
                 className="glass-badge-tight shadow-lg cursor-pointer" 
                 onClick={(e) => handleTooltipToggle('standalone-rating', e)}
                 onTouchEnd={(e) => handleTooltipToggle('standalone-rating', e)}
               >
                 <ClubhouseLogo size="sm" />
                 <span className="text-white">{playerRatingBadge.content}</span>
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
