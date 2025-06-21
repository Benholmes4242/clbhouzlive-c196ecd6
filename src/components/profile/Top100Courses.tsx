
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, MapPin, Eye, EyeOff } from 'lucide-react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import Top100CoursesModal from './Top100CoursesModal';

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
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    regionProgress,
    isLoading,
    handleVisibilityToggle
  } = useTop100CoursesData(userId, isOwnProfile);

  const shouldShowSection = isOwnProfile || top100Visible;

  if (!shouldShowSection) {
    return null;
  }

  const regions = [
    { key: 'britain-ireland', name: 'Britain & Ireland', emoji: '🇬🇧🇮🇪' },
    { key: 'usa', name: 'United States', emoji: '🇺🇸' },
    { key: 'europe', name: 'Continental Europe', emoji: '🇪🇺' },
    { key: 'global', name: 'Worldwide', emoji: '🌍' }
  ];

  const openModal = (regionKey: string) => {
    setSelectedRegion(regionKey);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <section className="mt-10 px-2">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-bold">Top 100 Courses</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading course data...
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mt-10 px-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold">Top 100 Courses</h2>
          </div>
          
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVisibilityToggle(!top100Visible)}
              className="text-muted-foreground hover:text-foreground"
            >
              {top100Visible ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hidden
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {regions.map((region) => {
            const progress = regionProgress[region.key];
            const percentage = progress?.total > 0 ? Math.round((progress.played / progress.total) * 100) : 0;
            
            return (
              <Card 
                key={region.key}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openModal(region.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{region.emoji}</span>
                      <h3 className="font-semibold text-sm">{region.name}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {progress?.played || 0}/{progress?.total || 0}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{percentage}% complete</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>View courses</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {selectedRegion && (
        <Top100CoursesModal
          region={selectedRegion}
          regionName={regions.find(r => r.key === selectedRegion)?.name || ''}
          userId={userId}
          isOwnProfile={isOwnProfile}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default Top100Courses;
