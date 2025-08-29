import React, { useState, useEffect } from 'react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData.tsx';
import { useProgressMotivation } from '@/hooks/useProgressMotivation';
import SimpleRegionalCourses from './SimpleRegionalCourses';

interface CoursesJourneyProps {
  className?: string;
  userId?: string;
  userDisplayName?: string;
  isOwnProfile?: boolean;
}

const CoursesJourney: React.FC<CoursesJourneyProps> = ({ 
  className = '', 
  userId = '', 
  userDisplayName = 'User',
  isOwnProfile = false 
}) => {
  const { regionProgress, isLoading } = useTop100CoursesData(userId || '', isOwnProfile);
  const { generateMotivation } = useProgressMotivation(userId, userDisplayName, isOwnProfile);
  const [motivationalMessages, setMotivationalMessages] = useState<{[key: string]: string}>({});

  const getProgressData = (region: string) => {
    const data = regionProgress[region] || { played: 0, total: 100 };
    const percentage = data.total > 0 ? (data.played / data.total) * 100 : 0;
    const remaining = Math.max(0, data.total - data.played);
    
    return {
      played: data.played,
      total: data.total,
      percentage: Math.min(percentage, 100),
      remaining
    };
  };

  // Generate motivational messages for all regions
  useEffect(() => {
    const generateAllMotivations = async () => {
      const regions = ['global', 'usa', 'britain-ireland', 'europe'];
      const messages: {[key: string]: string} = {};
      
      for (const region of regions) {
        const progress = getProgressData(region);
        if (progress.total > 0) {
          try {
            const message = await generateMotivation(region, progress.played, progress.total);
            messages[region] = message;
          } catch (error) {
            console.error(`Error generating motivation for ${region}:`, error);
          }
        }
      }
      
      setMotivationalMessages(messages);
    };

    if (regionProgress && Object.keys(regionProgress).length > 0) {
      generateAllMotivations();
    }
  }, [regionProgress, generateMotivation]);

  return (
    <div className={`w-full ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto px-4">
        {/* Courses Played Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Courses Played</h2>
        </div>

        {/* Regional Course Carousels */}
        <div className="space-y-12">
          <SimpleRegionalCourses
            userId={userId}
            region="global"
            title="Worldwide"
            isOwnProfile={isOwnProfile}
          />

          <SimpleRegionalCourses
            userId={userId}
            region="britain-ireland"
            title="Great Britain & Ireland"
            isOwnProfile={isOwnProfile}
          />

          <SimpleRegionalCourses
            userId={userId}
            region="europe"
            title="Continental Europe"
            isOwnProfile={isOwnProfile}
          />

          <SimpleRegionalCourses
            userId={userId}
            region="usa"
            title="USA"
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
    </div>
  );
};

export default CoursesJourney;