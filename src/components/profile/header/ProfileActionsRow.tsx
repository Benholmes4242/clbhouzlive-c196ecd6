import React from 'react';
import { ProfileSocialButtons } from '../actions/ProfileSocialButtons';
import { BusinessProfileActions } from '../actions/BusinessProfileActions';

interface ProfileActionsRowProps {
  currentUserId: string;
  profileUserId: string;
  isPersonal: boolean;
  isMobile: boolean;
  websiteUrl?: string | null;
  businessWebsite?: string | null;
}

/**
 * ProfileActionsRow - Displays social action buttons
 * Personal: Follow, Add Friend, More (via ProfileSocialButtons)
 * Business: Follow, Visit Website, More (via BusinessProfileActions)
 */
const ProfileActionsRow: React.FC<ProfileActionsRowProps> = ({
  currentUserId,
  profileUserId,
  isPersonal,
  isMobile,
  websiteUrl,
  businessWebsite
}) => {
  // Container styling for proper centering
  const containerStyle = isMobile 
    ? {} 
    : {
        width: 'calc(100% - var(--mini-w) - 8px)',
        marginRight: 'calc(var(--mini-w) + 8px)'
      };

  // Use businessWebsite for business profiles, fall back to websiteUrl
  const effectiveWebsite = !isPersonal ? (businessWebsite || websiteUrl) : websiteUrl;

  return (
    <div 
      className={`${isMobile ? 'mt-4 flex justify-center' : 'w-full mt-4 flex justify-center'}`}
      style={containerStyle}
    >
      {isPersonal ? (
        <ProfileSocialButtons
          currentUserId={currentUserId}
          profileUserId={profileUserId}
          isMobile={isMobile}
        />
      ) : (
        <BusinessProfileActions
          currentUserId={currentUserId}
          profileUserId={profileUserId}
          websiteUrl={effectiveWebsite}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default ProfileActionsRow;
