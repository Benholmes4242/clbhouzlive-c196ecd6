import React from 'react';
import MiniProfileSheet from './MiniProfileSheet';
import { useUserProfile } from '@/hooks/useUserProfile';

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
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!profileData) return null;

  const user = {
    id: profileData.id,
    name: profileData.display_name || 'Unknown User',
    avatar: profileData.profile_photo_url || undefined,
    username: profileData.username || undefined,
    homeClub: profileData.home_club || undefined,
    handicap: profileData.eg_handicap_index || undefined,
    isFollowing: false // This would need to be fetched from a follows table
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