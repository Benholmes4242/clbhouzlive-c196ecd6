
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Target, Map } from 'lucide-react';

interface RegionProgress {
  played: number;
  total: number;
}

interface Top100InteractiveProps {
  regionProgress: Record<string, RegionProgress>;
  nextGoalCourse?: {
    name: string;
    region: string;
  } | null;
  yearlyTarget?: {
    target: number;
    current: number;
  } | null;
  onRegionClick: (region: string) => void;
  isOwnProfile: boolean;
}

const Top100Interactive: React.FC<Top100InteractiveProps> = ({
  regionProgress,
  nextGoalCourse,
  yearlyTarget,
  onRegionClick,
  isOwnProfile
}) => {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const regions = [
    { key: 'britain-ireland', name: 'Britain & Ireland', flag: '🇬🇧' },
    { key: 'usa', name: 'United States', flag: '🇺🇸' },
    { key: 'europe', name: 'Continental Europe', flag: '🇪🇺' },
    { key: 'global', name: 'Worldwide', flag: '🌍' }
  ];

  const getProgressPercentage = (region: string) => {
    const progress = regionProgress[region];
    return progress?.total > 0 ? Math.round((progress.played / progress.total) * 100) : 0;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Map className="h-5 w-5 text-[#b66b41]" />
            Top 100 Courses
          </h3>
          {yearlyTarget && (
            <Badge variant="outline" className="text-[#b66b41] border-[#b66b41]">
              {yearlyTarget.current}/{yearlyTarget.target} this year
            </Badge>
          )}
        </div>

        {/* Goals Section */}
        {(nextGoalCourse || yearlyTarget) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#b66b41]/10 to-orange-50 rounded-lg border border-[#b66b41]/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-[#b66b41]" />
              <span className="font-medium text-[#b66b41]">Goals</span>
            </div>
            {nextGoalCourse && (
              <p className="text-sm text-gray-700 mb-1">
                Next up: <span className="font-medium">{nextGoalCourse.name}</span>
              </p>
            )}
            {yearlyTarget && (
              <p className="text-sm text-gray-700">
                Target: {yearlyTarget.target} courses this year
              </p>
            )}
          </div>
        )}

        {/* Region Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regions.map((region) => {
            const progress = regionProgress[region.key] || { played: 0, total: 0 };
            const percentage = getProgressPercentage(region.key);
            
            return (
              <Card 
                key={region.key}
                className="cursor-pointer hover:shadow-md transition-all duration-200 bg-muted border border-border hover:border-[#b66b41]/30"
                onClick={() => onRegionClick(region.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{region.flag}</span>
                      <h4 className="font-medium text-sm md:text-base text-foreground">{region.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs md:text-sm bg-background text-foreground border border-border">
                        {progress.played}/{progress.total}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
                      <span>{percentage}% complete</span>
                      <span>{progress.played} played</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isOwnProfile && (
          <Button 
            variant="outline" 
            className="w-full mt-4 text-[#b66b41] border-[#b66b41] hover:bg-[#b66b41] hover:text-white"
            onClick={() => onRegionClick('all')}
          >
            View All My Courses
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default Top100Interactive;
