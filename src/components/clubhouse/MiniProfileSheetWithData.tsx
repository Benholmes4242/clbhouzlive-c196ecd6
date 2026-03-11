import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const MiniProfileSheetSkeleton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-end justify-center">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
    
    {/* Skeleton Sheet */}
    <div className="relative flex flex-col overflow-hidden rounded-t-3xl w-full" style={{ background: '#F8FAFC', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}>
      {/* Handle */}
      <div className="flex justify-center pt-4 pb-2">
        <div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
      </div>
      
      {/* Skeleton Content */}
      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-2">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-muted clb-shimmer-light" />
        {/* Name */}
        <div className="h-4 w-[140px] rounded-full bg-muted clb-shimmer-light" />
        {/* Username */}
        <div className="h-3 w-[100px] rounded-full bg-muted/80 clb-shimmer-light" />
        {/* Stats row */}
        <div className="flex gap-2 mt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-8 rounded-lg bg-muted clb-shimmer-light" />
          ))}
        </div>
        {/* Follow button */}
        <div className="w-full h-10 rounded-full bg-muted clb-shimmer-light mt-1" />
      </div>
    </div>
  </div>
);

const MiniProfileSheetWithData: React.FC<MiniProfileSheetWithDataProps> = ({
  userId,
  isOpen,
  onClose,
  onFollow
}) => {
  const { data: profileData, isLoading } = useUserProfile(userId);

  if (!isOpen || !userId) return null;

  if (isLoading) {
    return <MiniProfileSheetSkeleton onClose={onClose} />;
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
