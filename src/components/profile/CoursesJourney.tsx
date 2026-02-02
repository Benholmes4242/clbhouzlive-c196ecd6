import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData.tsx';
import { useProgressMotivation } from '@/hooks/useProgressMotivation';
import { useSyncRatedHeightVar } from '@/hooks/useSyncRatedHeightVar';
import TopTenCoursesRatedByYou from '@/components/TopTenCoursesRatedByYou';
import HighlightsCarousel from './HighlightsCarousel';
import EnhancedRegionalCoursesModal from './EnhancedRegionalCoursesModal';

// Import refactored components
import RegionalProgressRings from './courses-journey/RegionalProgressRings';
import RecentlyPlayedSection from './courses-journey/RecentlyPlayedSection';
import CoursesbyRegionSection from './courses-journey/regions/CoursesbyRegionSection';
import type { CoursesJourneyProps } from './courses-journey/types';

const CoursesJourney: React.FC<CoursesJourneyProps> = ({ 
  className = '', 
  userId = '', 
  userDisplayName = 'User',
  isOwnProfile = false 
}) => {
  const { regionProgress, isLoading } = useTop100CoursesData(userId || '', isOwnProfile);
  const { generateMotivation } = useProgressMotivation(userId, userDisplayName, isOwnProfile);
  const [motivationalMessages, setMotivationalMessages] = useState<{[key: string]: string}>({});
  const [topTenModalOpen, setTopTenModalOpen] = useState(false);

  // Sync the rated card height to CSS variable
  useSyncRatedHeightVar();

  // Define the four regional achievements
  const regions = ['global', 'usa', 'britain-ireland', 'europe'] as const;
  
  // Build a stable key of the inputs that actually matter
  const progressKey = useMemo(() => {
    const payload = regions.map((r) => {
      const p = regionProgress?.[r] || { played: 0, total: 0 };
      return [r, p.played, p.total];
    });
    return JSON.stringify(payload);
  }, [regionProgress]);

  const inFlightRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (inFlightRef.current) return;

    const run = async () => {
      try {
        inFlightRef.current = true;

        const messages: Record<string, string> = {};
        for (const region of regions) {
          const progress = regionProgress?.[region];
          if (!progress || progress.total <= 0) continue;

          try {
            const message = await generateMotivation(
              region,
              progress.played,
              progress.total
            );
            messages[region] = message;
          } catch (err) {
            console.error(`Error generating motivation for ${region}:`, err);
          }
        }

        setMotivationalMessages(messages);
      } finally {
        inFlightRef.current = false;
      }
    };

    if (regionProgress && Object.keys(regionProgress).length > 0) {
      run();
    }
  }, [progressKey, isLoading, generateMotivation]);

  return (
    <div className={`w-full pt-8 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Top 10 Courses Rated by You Section */}
        <TopTenCoursesRatedByYou
          isOwnProfile={isOwnProfile}
          userDisplayName={userDisplayName}
          onOpenModal={() => setTopTenModalOpen(true)}
          userId={userId}
        />

        {/* Recently Played Section */}
        <RecentlyPlayedSection userId={userId} isOwnProfile={isOwnProfile} />

        {/* Highlights From My Journey Section */}
        <div className="w-full px-4 pt-4 pb-3">
          <div className="max-w-6xl mx-auto">
            <HighlightsCarousel userId={userId} className="mb-0" />
          </div>
        </div>

        {/* Courses by Region title */}
        <div className="w-full px-4 pt-3 pb-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-0">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground mb-0">
                Courses by Region
              </h3>
            </div>
          </div>
        </div>

        {/* Progress Rings Section */}
        <RegionalProgressRings 
          regionProgress={regionProgress} 
          isLoading={isLoading} 
        />

        {/* Courses by Region Section */}
        <div className="mt-1.5">
          <CoursesbyRegionSection 
            userId={userId} 
            isOwnProfile={isOwnProfile} 
            userDisplayName={userDisplayName} 
          />
        </div>

        {/* Top 10 Modal */}
        <EnhancedRegionalCoursesModal
          isOpen={topTenModalOpen}
          onClose={() => setTopTenModalOpen(false)}
          regionName="Worldwide"
          courses={[]}
          isOwnProfile={isOwnProfile}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default CoursesJourney;
