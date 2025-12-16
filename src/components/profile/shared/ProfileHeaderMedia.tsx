/**
 * Shared ProfileHeaderMedia component
 * Used in both Profile page and Edit Profile preview to ensure identical crop
 */
import React from 'react';

interface ProfileHeaderMediaProps {
  headerUrl?: string | null;
  fallbackUrl?: string | null;
  className?: string;
}

// Canonical height for profile header - same everywhere
const HEADER_HEIGHT = 250;

export const ProfileHeaderMedia: React.FC<ProfileHeaderMediaProps> = ({
  headerUrl,
  fallbackUrl,
  className = '',
}) => {
  const displayUrl = headerUrl || fallbackUrl;

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height: HEADER_HEIGHT }}
    >
      {displayUrl ? (
        <img 
          src={displayUrl} 
          alt="Profile cover" 
          className="w-full h-full object-cover object-bottom"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
      )}
    </div>
  );
};

export { HEADER_HEIGHT };
