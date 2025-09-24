import React from 'react';

interface ProfileBioBlockProps {
  bio?: string;
  website?: string;
  recentlyFollowedBy?: string[];
}

const ProfileBioBlock: React.FC<ProfileBioBlockProps> = ({
  bio,
  website,
  recentlyFollowedBy = []
}) => {
  if (!bio && !website && recentlyFollowedBy.length === 0) return null;

  return (
    <div className="px-6 space-y-3">
      {bio && (
        <p className="text-base leading-6 text-white/90 text-center">{bio}</p>
      )}

      {website && (
        <p className="text-center">
          <a
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 underline decoration-white/40 hover:decoration-white/70 text-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 rounded text-sm"
          >
            {website.replace(/^https?:\/\//, "")}
          </a>
        </p>
      )}

      {recentlyFollowedBy.length > 0 && (
        <p className="text-sm text-white/70 text-center">
          Followed by{" "}
          <span className="font-medium text-white/90">
            {recentlyFollowedBy.slice(0, 2).join(", ")}
          </span>
          {recentlyFollowedBy.length > 2 ? " and others" : ""}
        </p>
      )}
    </div>
  );
};

export default ProfileBioBlock;