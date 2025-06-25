
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

  console.log('CourseRankBadges Debug:', {
    country,
    viewContext,
    regionalRank,
    globalRank,
    usaRank,
    isGBI,
    isUSA,
    isEurope
  });

  // Determine which rank to show based on context
  const getRankBadge = () => {
    if (viewContext === 'global' && globalRank && globalRank <= 100) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Trophy className="h-3 w-3 mr-1" />
          #{globalRank} World
        </Badge>
      );
    }
    
    if (viewContext === 'regional' && regionalRank && regionalRank <= 100) {
      if (isGBI) {
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            <MapPin className="h-3 w-3 mr-1" />
            #{regionalRank} GB&I
          </Badge>
        );
      }
    }
    
    if (viewContext === 'usa' && usaRank && usaRank <= 100 && isUSA) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <Flag className="h-3 w-3 mr-1" />
          #{usaRank} USA
        </Badge>
      );
    }
    
    if (viewContext === 'europe' && regionalRank && regionalRank <= 100 && isEurope) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
          <Globe className="h-3 w-3 mr-1" />
          #{regionalRank} Continental Europe
        </Badge>
      );
    }
    
    return null;
  };

  const rankBadge = getRankBadge();
  const showTop100Badge = globalRank && globalRank <= 100;

  return (
    <>
      {/* Regional rank badge on the left */}
      {rankBadge && (
        <div className="absolute top-2 left-2">
          {rankBadge}
        </div>
      )}
      
      {/* Top 100 badge on the right */}
      {showTop100Badge && (
        <div className="absolute top-2 right-2">
          <Badge 
            variant="default" 
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Top 100
          </Badge>
        </div>
      )}
    </>
  );
};

export default CourseRankBadges;
