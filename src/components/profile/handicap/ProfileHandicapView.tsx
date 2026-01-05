import React from 'react';
import HandicapSummaryCard from './HandicapSummaryCard';
import OfficialSyncPromoCard from './OfficialSyncPromoCard';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface ProfileHandicapViewProps {
  userId: string;
  profile: {
    eg_handicap_index?: number | null;
    handicap_sync_interest?: boolean | null;
    [key: string]: any;
  };
  isOwnProfile: boolean;
}

const ProfileHandicapView: React.FC<ProfileHandicapViewProps> = ({
  userId,
  profile,
  isOwnProfile,
}) => {
  const handicapIndex = profile?.eg_handicap_index ?? null;
  // Note: using eg_handicap_index updated_at would require schema change,
  // for now we use the profile's updated_at as a proxy
  const lastUpdatedAt = null; // Will be set when handicap_last_updated_at field is added

  return (
    <div className="pb-8">
      <ScrollToTopGlass />
      
      {/* Section 1: Handicap Summary Card */}
      <div className="px-4">
        <HandicapSummaryCard
          handicapIndex={handicapIndex}
          lastUpdatedAt={lastUpdatedAt}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* Section 2: Official Sync Promo Card */}
      {isOwnProfile && (
        <div className="px-4 mt-4">
          <OfficialSyncPromoCard
            userId={userId}
            hasRegisteredInterest={profile?.handicap_sync_interest ?? false}
          />
        </div>
      )}

      {/* Section 3: Handicap Journey Graph (hidden for now) */}
      {/* <HandicapJourneyGraph /> */}
    </div>
  );
};

export default ProfileHandicapView;
