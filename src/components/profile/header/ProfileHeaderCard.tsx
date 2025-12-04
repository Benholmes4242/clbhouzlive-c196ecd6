import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { splitName } from '@/utils/name';
import { ProfileOpenToPlayStatus } from '@/features/nearby/components/ProfileOpenToPlayStatus';

interface ProfileHeaderCardProps {
  displayName: string;
  username: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  // Personal profile fields
  homeClub?: string | null;
  // Business profile fields  
  websiteUrl?: string | null;
  location?: string | null;
  // Profile type
  isPersonal: boolean;
  isOwnProfile: boolean;
  isMobile: boolean;
  onAvatarClick?: () => void;
}

/**
 * ProfileHeaderCard - Displays avatar, name, handle, bio, and profile-type-specific fields
 * Personal: Shows home club
 * Business: Shows website and location
 */
const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  displayName,
  username,
  bio,
  profilePhotoUrl,
  homeClub,
  websiteUrl,
  location,
  isPersonal,
  isOwnProfile,
  isMobile,
  onAvatarClick
}) => {
  const { first, last } = splitName(displayName);
  
  // Format website URL for display
  const formatWebsiteUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '');
  };
  
  // Ensure URL has protocol for href
  const getWebsiteHref = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  if (isMobile) {
    return (
      <div className="relative">
        {/* Mini profile card / Avatar */}
        <button
          data-mini-card
          type="button"
          aria-label="Open mini profile media"
          className="mini-card cursor-pointer"
          onClick={onAvatarClick}
          style={{ padding: 0, border: 'none', background: 'none', overflow: 'visible' }}
        >
          {profilePhotoUrl && (
            <div style={{ width: '100%', height: '100%' }}>
              <Squircle width={255} height={255}>
                <img 
                  src={profilePhotoUrl} 
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  decoding="async"
                />
              </Squircle>
            </div>
          )}
        </button>

        {/* Name & handle block */}
        <div className="name-wrap relative top-6 md:top-0" data-nameblock>
          <span className="name-first">{first}</span>
          <span className="name-last">{last}</span>
          <div className="handle">@{username}</div>
          {isOwnProfile && <ProfileOpenToPlayStatus />}
        </div>

        {/* Home Club - Personal profiles only */}
        {isPersonal && homeClub && (
          <div className="meta-row relative top-8 md:top-0">
            <div className="meta meta-club">
              <div className="meta-label">Home Club</div>
              <div className="meta-value">{homeClub}</div>
            </div>
          </div>
        )}
        
        {/* Website - Business profiles only */}
        {!isPersonal && websiteUrl && (
          <div className="meta-row relative top-8 md:top-0">
            <div className="meta meta-club">
              <div className="meta-label">Website</div>
              <div className="meta-value">
                <a 
                  href={getWebsiteHref(websiteUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  {formatWebsiteUrl(websiteUrl)}
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Location - Business profiles only */}
        {!isPersonal && location && (
          <div className="meta-row relative top-8 md:top-0">
            <div className="meta meta-club">
              <div className="meta-label">Location</div>
              <div className="meta-value">{location}</div>
            </div>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="bio">{bio}</p>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col items-center relative">
      {/* Overhanging mini profile card */}
      <div
        className="absolute z-10 cursor-pointer"
        style={{
          width: 'var(--mini-w)',
          height: 'var(--mini-h)',
          right: '80px',
          top: 'calc(var(--mini-h) * -0.24)',
          overflow: 'visible'
        }}
        onClick={onAvatarClick}
        role="button"
        aria-label="Open immersive profile"
      >
        {profilePhotoUrl && (
          <Squircle width={255} height={255}>
            <img 
              src={profilePhotoUrl} 
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
            />
          </Squircle>
        )}
      </div>

      {/* Name + handle block */}
      <div
        className="text-center"
        style={{
          width: 'calc(100% - var(--mini-w) - 8px)',
          marginLeft: '0',
          marginRight: 'calc(var(--mini-w) + 8px)',
          marginTop: '24px'
        }}
      >
        <h1 className="font-semibold leading-tight" style={{ fontSize: 'var(--fs-display)' }}>
          {displayName}
        </h1>
        <div className="text-base text-muted-foreground">@{username}</div>
      </div>

      {/* Home Club - Personal profiles only */}
      {isPersonal && homeClub && (
        <div 
          className="mt-10 flex justify-center items-start"
          style={{
            width: 'calc(100% - var(--mini-w) - 8px)',
            marginRight: 'calc(var(--mini-w) + 8px)'
          }}
        >
          <div className="text-center">
            <div className="text-base font-semibold">Home Club</div>
            <div className="text-base text-muted-foreground">{homeClub}</div>
          </div>
        </div>
      )}

      {/* Bio section */}
      <div 
        className="mt-6"
        style={{
          width: 'calc(100% - var(--mini-w) - 8px)',
          marginRight: 'calc(var(--mini-w) + 8px)'
        }}
      >
        <div className="text-center">
          {bio && (
            <p className="text-base text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
              {bio}
            </p>
          )}
          
          {/* Website - shown for all profiles that have it on desktop */}
          {websiteUrl && (
            <div className="text-center">
              <a 
                href={getWebsiteHref(websiteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded"
              >
                {formatWebsiteUrl(websiteUrl)}
              </a>
            </div>
          )}
          
          {/* Location - Business profiles only */}
          {!isPersonal && location && (
            <div className="text-center mt-2 text-sm text-muted-foreground">
              📍 {location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
