import React from 'react';

interface ProfileStatsRowProps {
  posts: number;
  totalXp: number | string;
  following: number;
  followers: number;
  onStatClick?: (statType: string) => void;
}

const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({
  posts,
  totalXp,
  following,
  followers,
  onStatClick
}) => {
  const StatItem = ({ 
    label, 
    value, 
    statType 
  }: { 
    label: string; 
    value: string | number; 
    statType: string; 
  }) => (
    <button
      onClick={() => onStatClick?.(statType)}
      className="flex flex-col items-center justify-center py-4 px-3 hover:bg-gray-50/50 transition-colors group"
    >
      <div className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-slate-700">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide text-slate-500 group-hover:text-slate-600">
        {label}
      </div>
    </button>
  );

  return (
    <div className="px-4 md:px-8 mt-4">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 divide-x divide-gray-200/80">
          <StatItem label="Posts" value={posts} statType="posts" />
          <StatItem label="Total XP" value={totalXp} statType="totalxp" />
          <StatItem label="Following" value={following} statType="following" />
          <StatItem label="Followers" value={followers} statType="followers" />
        </div>
      </div>
    </div>
  );
};

export default ProfileStatsRow;