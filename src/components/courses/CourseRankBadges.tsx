
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Globe, MapPin, Flag } from 'lucide-react';

interface CourseRankBadgesProps {
  globalRank: number | null;
  regionalRank: number | null;
  usaRank: number | null;
  country: string;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
}

const CourseRankBadges = ({ 
  globalRank, 
  regionalRank, 
  usaRank, 
  country, 
  viewContext = 'global' 
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
          <MapPin className="h-3 w-3 mr-1" />
          #{regionalRank} GB&I
        </Badge>
      );
    }
    
    if (isUSA && usaRank && usaRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          <Flag className="h-3 w-3 mr-1" />
          #{usaRank} USA
        </Badge>
      );
    }
    
    if (isEurope && regionalRank && regionalRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          <Globe className="h-3 w-3 mr-1" />
          #{regionalRank} Continental Europe
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
          <Trophy className="h-3 w-3 mr-1" />
          #{globalRank} World
        </Badge>
      );
    }
    return null;
  };

  const regionalBadge = getRegionalRankBadge();
  const worldwideBadge = getWorldwideRankBadge();

  return (
    <>
      {/* Regional rank badge on the left */}
      {regionalBadge && (
        <div className="absolute top-2 left-2">
          {regionalBadge}
        </div>
      )}
      
      {/* Worldwide rank badge on the right */}
      {worldwideBadge && (
        <div className="absolute top-2 right-2">
          {worldwideBadge}
        </div>
      )}
    </>
  );
};

export default CourseRankBadges;
