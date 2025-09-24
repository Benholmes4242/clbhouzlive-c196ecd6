import React from 'react';

interface ProfileStatsRowProps {
  posts: number | string;
  totalXp: number | string;
  following: number | string;
  followers: number | string;
}

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col items-center justify-center gap-1 px-3 py-3">
    <div className="text-lg font-semibold tracking-tight text-white">{value}</div>
    <div className="text-xs uppercase tracking-wide text-white/70">{label}</div>
  </div>
);

const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({
  posts,
  totalXp,
  following,
  followers
}) => {
  return (
    <div className="mx-6 mb-4">
      <div className="grid grid-cols-4 divide-x divide-white/20">
        <StatItem label="Posts" value={posts} />
        <StatItem label="Total XP" value={totalXp} />
        <StatItem label="Following" value={following} />
        <StatItem label="Followers" value={followers} />
      </div>
    </div>
  );
};

export default ProfileStatsRow;