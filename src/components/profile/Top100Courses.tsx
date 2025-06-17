
import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Top100CoursesModal from './Top100CoursesModal';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';

interface Top100CoursesProps {
  userId: string;
  isOwnProfile?: boolean;
  top100Visible?: boolean;
}

const Top100Courses: React.FC<Top100CoursesProps> = ({
  userId,
  isOwnProfile = false,
  top100Visible = true
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isTop100Visible, setIsTop100Visible] = useState(top100Visible);
  
  const { 
    regionProgress, 
    isLoading, 
    handleVisibilityToggle 
  } = useTop100CoursesData(userId, isOwnProfile);

  const regions = [
    { 
      key: 'global', 
      name: 'World Top 100',
      description: 'Top 100 courses worldwide'
    },
    { 
      key: 'britain-ireland', 
      name: 'Britain & Ireland',
      description: 'Top courses across the British Isles'
    },
    { 
      key: 'usa', 
      name: 'USA',
      description: 'Premier courses across the United States'
    },
    { 
      key: 'europe', 
      name: 'Europe',
      description: 'Continental European golf courses'
    }
  ];

  const onVisibilityToggle = async (checked: boolean) => {
    setIsTop100Visible(checked);
    if (isOwnProfile && handleVisibilityToggle) {
      await handleVisibilityToggle(checked);
    }
  };

  const shouldShowSection = isOwnProfile || isTop100Visible;

  if (!shouldShowSection) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="mt-10 px-2">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-bold">Top 100 Courses</h2>
        </div>
        <p className="text-muted-foreground text-base">Loading...</p>
      </section>
    );
  }

  return (
    <section className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold">Top 100 Courses</h2>
        {isOwnProfile && (
          <div className="flex items-center space-x-2 ml-auto">
            <Checkbox
              id="top100-visibility"
              checked={isTop100Visible}
              onCheckedChange={onVisibilityToggle}
            />
            <Label
              htmlFor="top100-visibility"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show this section on my public profile
            </Label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {regions.map((region) => {
          const progress = regionProgress[region.key] || { played: 0, total: 100 };
          const percentage = progress.total > 0 ? (progress.played / progress.total) * 100 : 0;
          
          return (
            <div
              key={region.key}
              className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedRegion(region.key)}
            >
              <h3 className="font-semibold text-lg mb-2">{region.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{region.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Played: {progress.played} / {progress.total}</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>

      {selectedRegion && (
        <Top100CoursesModal
          region={selectedRegion}
          regionName={regions.find(r => r.key === selectedRegion)?.name || ''}
          userId={userId}
          isOwnProfile={isOwnProfile}
          isOpen={!!selectedRegion}
          onClose={() => setSelectedRegion(null)}
        />
      )}
    </section>
  );
};

export default Top100Courses;
