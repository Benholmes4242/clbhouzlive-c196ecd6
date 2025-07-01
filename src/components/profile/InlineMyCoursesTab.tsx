
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface InlineMyCoursesTabProps {
  profile: any;
  regionProgress: Record<string, { played: number; total: number }>;
  isOwnProfile: boolean;
  username: string;
  onRegionClick: (region: string) => void;
  onEGConnect: () => void;
}

const InlineMyCoursesTab: React.FC<InlineMyCoursesTabProps> = ({
  profile,
  regionProgress,
  isOwnProfile,
  username,
  onRegionClick,
  onEGConnect
}) => {
  // Calculate total courses played across all regions
  const totalPlayedCourses = Object.values(regionProgress).reduce(
    (sum, region) => sum + region.played, 
    0
  );

  return (
    <div className="p-4 space-y-6">
      {/* Summary Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#b66b41]" />
              <h3 className="font-semibold text-lg">Course Statistics</h3>
            </div>
            <Badge variant="secondary" className="text-[#b66b41] border-[#b66b41]">
              {totalPlayedCourses} courses played
            </Badge>
          </div>
          
          <div className="text-center py-8">
            <div className="text-3xl font-bold text-[#b66b41] mb-2">
              {totalPlayedCourses}
            </div>
            <p className="text-muted-foreground">
              Total Top 100 courses played
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InlineMyCoursesTab;
