
import React from "react";
import { EditProfileModal } from "./EditProfileModal";

interface ProfileEditDialogProps {
  profile: {
    display_name?: string | null;
    username?: string | null;
    home_club?: string | null;
    eg_handicap_index?: number | null;
    is_public?: boolean | null;
    user_type?: string | null;
    business_name?: string | null;
    business_type?: string | null;
    contact_person_name?: string | null;
    phone?: string | null;
    website_url?: string | null;
    location?: string | null;
    bio?: string | null;
    profile_photo_url?: string | null;
    header_photo_url?: string | null;
  } | null;
  userId: string;
  onProfileUpdate: () => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  profile,
  userId,
  onProfileUpdate,
}) => {
  return (
    <EditProfileModal
      profile={profile}
      userId={userId}
      onProfileUpdate={onProfileUpdate}
    />
  );
};

export default ProfileEditDialog;
