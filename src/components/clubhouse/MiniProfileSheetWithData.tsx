import React from 'react';
import MiniProfileSheet from './MiniProfileSheet';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getProfileDisplayName, getProfileType } from '@/types/profile';
import { BUSINESS_CATEGORIES } from '@/types/profile';

interface MiniProfileSheetWithDataProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onFollow?: () => void;
}

const MiniProfileSheetWithData: React.FC<MiniProfileSheetWithDataProps> = ({
  userId,
  isOpen,
  onClose,
  onFollow
}) => {
  const { data: profileData, isLoading } = useUserProfile(userId);

  // Always render the component when open or when there's data to show during closing animation
  if (!isOpen || !userId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        
        {/* Loading Sheet with Same Dimensions */}
        <div className="mini-profile-sheet-loading relative flex flex-col overflow-hidden rounded-t-3xl" style={{ background: '#F8FAFC', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}>
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
          </div>
          
          {/* Loading Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const profileType = getProfileType(profileData);
  const displayName = getProfileDisplayName(profileData);
  
  // Get category label for business profiles (categories are now stored as display strings)
  const getCategoryLabel = (category: string | null | undefined): string => {
    return category || '';
  };

  const user = {
    id: profileData.id,
    name: displayName || 'Unknown User',
    avatar: profileData.profile_photo_url || undefined,
    username: profileData.username || undefined,
    homeClub: profileData.home_club || undefined,
    handicap: profileData.eg_handicap_index || undefined,
    isFollowing: false, // This would need to be fetched from a follows table
    // Business profile data
    profileType: profileType,
    isBusiness: profileType === 'business',
    businessCategory: profileData.business_category ? getCategoryLabel(profileData.business_category) : undefined,
    businessLocation: profileData.business_location || undefined,
    isVerifiedBusiness: profileData.is_verified_business || false,
  };

  return (
    <MiniProfileSheet
      user={user}
      isOpen={isOpen}
      onClose={onClose}
      onFollow={onFollow}
    />
  );
};

export default MiniProfileSheetWithData;
