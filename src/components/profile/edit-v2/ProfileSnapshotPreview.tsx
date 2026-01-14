import React from 'react';
import { User } from 'lucide-react';

interface ProfileSnapshotPreviewProps {
  displayName: string;
  homeClub: string;
  handicap: string;
  bio?: string; // Not displayed in snapshot, kept for backwards compatibility
  profilePhotoUrl?: string | null;
  profilePhotoPreview?: string | null;
}

export const ProfileSnapshotPreview: React.FC<ProfileSnapshotPreviewProps> = ({
  displayName,
  homeClub,
  handicap,
  profilePhotoUrl,
  profilePhotoPreview,
}) => {
  const photoUrl = profilePhotoPreview || profilePhotoUrl;
  const hasHandicap = handicap && handicap.trim() !== '';
  const hasHomeClub = homeClub && homeClub.trim() !== '';
  
  return (
    <div className="rounded-2xl bg-white/80 border border-slate-100 p-4 flex items-center gap-3">
      {/* Avatar - squircle spec: 1/1.05 aspect, 34% radius */}
      <div 
        className="overflow-hidden bg-[#F8FAFC] border border-border/50 flex-shrink-0 flex items-center justify-center"
        style={{
          width: '56px',
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
        }}
      >
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt="Profile" 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <User className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {/* Info: Name + Club */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">
          {displayName || 'Your name'}
        </div>
        {hasHomeClub && (
          <div className="text-xs text-slate-500 truncate">
            {homeClub}
          </div>
        )}
      </div>

      {/* HCP badge - matches profile-hcp-pill styling from ProfileHeaderCard */}
      {hasHandicap && (
        <div 
          className="ml-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            background: '#EDEFF2',
            color: '#5E666D',
            border: '1px solid rgba(31, 36, 40, 0.06)',
          }}
        >
          HCP {handicap}
        </div>
      )}
    </div>
  );
};
