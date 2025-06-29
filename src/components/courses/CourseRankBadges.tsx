
import React from 'react';
import { Badge } from '@/components/ui/badge';

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

  // Determine regional rank display
  const getRegionalRankBadge = () => {
    if (isGBI && regionalRank && regionalRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          {regionalRank} GB&I
        </Badge>
      );
    }
    
    if (isUSA && usaRank && usaRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
          {usaRank} USA
        </Badge>
      );
    }
    
    if (isEurope && regionalRank && regionalRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          {regionalRank} Continental Europe
        </Badge>
      );
    }
    
    return null;
  };

  // Determine worldwide rank display
  const getWorldwideRankBadge = () => {
    if (globalRank && globalRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          {globalRank} Worldwide
        </Badge>
      );
    }
    return null;
  };

  // Player rating badge
  const getPlayerRatingBadge = () => {
    if (showUserRating && userRating !== null && userRating !== undefined) {
      return (
        <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-300">
          {userRating}/10
        </Badge>
      );
    }
    return null;
  };

  const regionalBadge = getRegionalRankBadge();
  const worldwideBadge = getWorldwideRankBadge();
  const playerRatingBadge = getPlayerRatingBadge();

  return (
    <>
      {/* Left side: Worldwide and Regional rankings */}
      {worldwideBadge ? (
        <>
          <div className="absolute top-2 left-2">
            {worldwideBadge}
          </div>
          {regionalBadge && (
            <div className="absolute top-10 left-2">
              {regionalBadge}
            </div>
          )}
        </>
      ) : (
        regionalBadge && (
          <div className="absolute top-2 left-2">
            {regionalBadge}
          </div>
        )
      )}

      {/* Right side: Player rating badge */}
      {playerRatingBadge && (
        <div className="absolute top-2 right-2">
          {playerRatingBadge}
        </div>
      )}
    </>
  );
};

export default CourseRankBadges;
