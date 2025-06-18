
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

interface CourseRankBadgesProps {
  globalRank: number | null;
  regionalRank: number | null;
  country: string;
  viewContext?: 'global' | 'regional';
}

const CourseRankBadges = ({ globalRank, regionalRank, country, viewContext = 'global' }: CourseRankBadgesProps) => {
  const isGBIRegion = country === 'United Kingdom' || country === 'Ireland';
  
  return (
    <div className="absolute top-3 left-3 flex gap-2">
      {/* Global rank badge - only show if course has global ranking and we're in global view */}
      {globalRank && viewContext === 'global' && (
        <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
          <Globe className="h-3 w-3 mr-1" />
          {globalRank}
        </Badge>
      )}
      
      {/* Regional rank badge - show GB&I for UK/Ireland courses */}
      {regionalRank && (
        <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-600">
          {isGBIRegion ? `GB&I ${regionalRank}` : `Regional ${regionalRank}`}
        </Badge>
      )}
    </div>
  );
};

export default CourseRankBadges;
