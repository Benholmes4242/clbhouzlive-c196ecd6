
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Globe, MapPin, Flag } from 'lucide-react';

interface CourseRankBadgesProps {
  globalRank: number | null;
  regionalRank: number | null;
  usaRank: number | null;
  country: string;
  viewContext?: 'global' | 'regional';
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

  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1">
      {/* Global Rank Badge */}
      {globalRank && globalRank <= 100 && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Trophy className="h-3 w-3 mr-1" />
          #{globalRank} World
        </Badge>
      )}

      {/* Regional Rank Badge (GB&I) */}
      {isGBI && regionalRank && regionalRank <= 100 && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
          <MapPin className="h-3 w-3 mr-1" />
          #{regionalRank} GB&I
        </Badge>
      )}

      {/* USA Rank Badge */}
      {isUSA && usaRank && usaRank <= 100 && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <Flag className="h-3 w-3 mr-1" />
          #{usaRank} USA
        </Badge>
      )}

      {/* Show appropriate ranking based on view context */}
      {viewContext === 'regional' && !globalRank && !regionalRank && !usaRank && (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <Globe className="h-3 w-3 mr-1" />
          Unranked
        </Badge>
      )}
    </div>
  );
};

export default CourseRankBadges;
