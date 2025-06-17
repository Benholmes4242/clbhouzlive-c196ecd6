
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

interface CourseRankBadgesProps {
  globalRank: number | null;
  regionalRank: number | null;
  country: string;
}

const CourseRankBadges = ({ globalRank, regionalRank, country }: CourseRankBadgesProps) => {
  const isGBIRegion = country === 'United Kingdom' || country === 'Ireland';
  const regionalLabel = isGBIRegion ? 'GB&I' : 'Regional';

  return (
    <div className="absolute top-3 left-3 flex gap-2">
      {globalRank && (
        <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
          <Globe className="h-3 w-3 mr-1" />
          #{globalRank}
        </Badge>
      )}
      {regionalRank && (
        <Badge variant="secondary">
          {regionalLabel} #{regionalRank}
        </Badge>
      )}
    </div>
  );
};

export default CourseRankBadges;
