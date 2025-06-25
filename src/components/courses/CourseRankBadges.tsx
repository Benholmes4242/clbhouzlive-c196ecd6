
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
  const isUK = country === 'United Kingdom';
  const isIreland = country === 'Ireland';
  const isUSA = country === 'United States';
  const isGBI = isUK || isIreland;
  const isEurope = country === 'Continental Europe';

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

  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1">
      {rankBadge}
    </div>
  );
};

export default CourseRankBadges;
