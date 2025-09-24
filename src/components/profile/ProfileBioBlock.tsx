import React from 'react';

type ProfileBioBlockProps = {
  bio?: string;
  websiteUrl?: string;
  recentlyFollowedBy?: string[]; // e.g. ["alice", "bob"]
};

const ProfileBioBlock: React.FC<ProfileBioBlockProps> = ({
  bio,
  websiteUrl,
  recentlyFollowedBy = [],
}) => {
  if (!bio && !websiteUrl && recentlyFollowedBy.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 mt-2">
      {bio && (
        <p className="text-base leading-6 text-slate-900">{bio}</p>
      )}

      {websiteUrl && (
        <p className="mt-2">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 underline decoration-slate-400 hover:decoration-slate-700 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded"
          >
            {websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        </p>
      )}

      {recentlyFollowedBy.length > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Followed by{" "}
          <span className="font-medium text-slate-700">
            {recentlyFollowedBy.slice(0, 2).join(", ")}
          </span>
          {recentlyFollowedBy.length > 2 ? " and others" : ""}
        </p>
      )}
    </section>
  );
};

export default ProfileBioBlock;