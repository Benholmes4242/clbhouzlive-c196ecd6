import React from 'react';

interface ProfileBioSectionProps {
  bio?: string;
  website?: string;
  recentlyFollowedBy?: string[];
}

const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({
  bio,
  website,
  recentlyFollowedBy = []
}) => {
  if (!bio && !website && recentlyFollowedBy.length === 0) return null;

  return (
    <div className="px-4 md:px-8 space-y-2">
      {/* Bio text */}
      {bio && (
        <p className="text-base leading-6 text-slate-900">
          {bio}
        </p>
      )}

      {/* Website link */}
      {website && (
        <p>
          <a
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {website.replace(/^https?:\/\//, '')}
          </a>
        </p>
      )}

      {/* Recently followed by */}
      {recentlyFollowedBy.length > 0 && (
        <p className="text-sm text-slate-500">
          Followed by{' '}
          <span className="font-medium text-slate-700">
            {recentlyFollowedBy.slice(0, 2).join(', ')}
          </span>
          {recentlyFollowedBy.length > 2 ? ' and others' : ''}
        </p>
      )}
    </div>
  );
};

export default ProfileBioSection;