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
    websites?: string[] | null;
    mobile_crop_x?: number | null;
    mobile_crop_y?: number | null;
    mobile_crop_width?: number | null;
    mobile_crop_height?: number | null;
    desktop_crop_x?: number | null;
    desktop_crop_y?: number | null;
    desktop_crop_width?: number | null;
    desktop_crop_height?: number | null;
    mini_card_crop_x?: number | null;
    mini_card_crop_y?: number | null;
    mini_card_crop_width?: number | null;
    mini_card_crop_height?: number | null;
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