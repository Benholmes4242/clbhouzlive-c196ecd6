import React from 'react';
import HandicapSummaryCard from './HandicapSummaryCard';
import OfficialSyncPromoCard from './OfficialSyncPromoCard';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface ProfileHandicapViewProps {
  userId: string;
  profile: {
    eg_handicap_index?: number | null;
    handicap_sync_interest?: boolean | null;
    updated_at?: string | null;
    [key: string]: any;
  };
  isOwnProfile: boolean;
}

const ProfileHandicapView: React.FC<ProfileHandicapViewProps> = ({
  userId,
  profile,
  isOwnProfile,
}) => {
  // Use eg_handicap_index for manual handicap (matches Edit Profile field)
  const handicapIndex = profile?.eg_handicap_index ?? null;
  // Use profile updated_at as proxy until dedicated handicap timestamp field exists
  const lastUpdatedAt = handicapIndex != null ? profile?.updated_at ?? null : null;

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
