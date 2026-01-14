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
    <div 
      className="rounded-2xl bg-white border border-[#e2e8f0] p-4 flex items-center gap-3"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
    >
      {/* Avatar - squircle spec: 1/1.05 aspect, 34% radius */}
      <div 
        className="overflow-hidden bg-[#F8FAFC] border border-[#e2e8f0] flex-shrink-0 flex items-center justify-center"
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
          <div className="h-full w-full flex items-center justify-center text-[#64748b]">
            <User className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {/* Info: Name + Club */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#1e293b] truncate">
          {displayName || 'Your name'}
        </div>
        {hasHomeClub && (
          <div className="text-xs text-[#64748b] truncate">
            {homeClub}
          </div>
        )}
      </div>

      {/* HCP badge - matches profile-hcp-pill styling with design system colors */}
      {hasHandicap && (
        <div 
          className="ml-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            background: '#e2e8f0',
            color: '#64748b',
            border: '1px solid #e2e8f0',
          }}
        >
          HCP {handicap}
        </div>
      )}
    </div>
  );
};
