import React from 'react';
import { User } from 'lucide-react';

interface ProfileSnapshotPreviewProps {
  displayName: string;
  homeClub: string;
  handicap: string;
  bio: string;
  profilePhotoUrl?: string | null;
  profilePhotoPreview?: string | null;
}

export const ProfileSnapshotPreview: React.FC<ProfileSnapshotPreviewProps> = ({
  displayName,
  homeClub,
  handicap,
  bio,
  profilePhotoUrl,
  profilePhotoPreview,
}) => {
  const photoUrl = profilePhotoPreview || profilePhotoUrl;
  const hasHandicap = handicap && handicap.trim() !== '';
  const hasHomeClub = homeClub && homeClub.trim() !== '';
  
  return (
    <div className="bg-muted/30 rounded-sq-md p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 font-medium">
        Profile snapshot
      </p>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-[28%] overflow-hidden bg-muted/60 border border-border/50 flex-shrink-0">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {displayName || 'Your name'}
            </span>
            {hasHandicap && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-sq-xs">
                {handicap}
              </span>
            )}
          </div>
          {hasHomeClub && (
            <p className="text-xs text-muted-foreground truncate">
              {homeClub}
            </p>
          )}
          {bio && (
            <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
              {bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
