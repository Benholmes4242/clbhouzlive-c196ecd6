
import React from 'react';
import ProfileEditDialog from './ProfileEditDialog';

interface ProfileInfoProps {
  profile: {
    display_name?: string | null;
    username?: string | null;
    home_club?: string | null;
    eg_handicap_index?: number | null;
  } | null;
  userEmail?: string;
  userId?: string;
  onProfileUpdate: () => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profile,
  userEmail,
  userId,
  onProfileUpdate
}) => {
  return (
    <div className="flex flex-col items-center mt-6 space-y-3">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">
          {profile?.display_name || profile?.username || userEmail || "Anonymous User"}
        </h1>
        <p className="text-muted-foreground">London, England, United Kingdom</p>
        <p className="text-sm">
          <span>Home Club:</span> {profile?.home_club || "Not set"}
        </p>
        <p className="text-sm">
          <span>Handicap:</span> {profile?.eg_handicap_index || "Not set"}
        </p>
      </div>
      
      {userId && (
        <ProfileEditDialog
          profile={profile}
          userId={userId}
          onProfileUpdate={onProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfileInfo;
