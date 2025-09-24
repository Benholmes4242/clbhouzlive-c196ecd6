import React from 'react';

type ProfileStatsRowProps = {
  posts: number | string;
  totalXp: number | string; // keep existing value as-is
  following: number | string;
  followers: number | string;
};

const Item = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col items-center justify-center gap-1 px-3 py-2">
    <div className="text-lg font-semibold tracking-tight text-slate-900">{value}</div>
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
  </div>
);

const ProfileStatsRow: React.FC<ProfileStatsRowProps> = ({
  posts,
  totalXp,
  following,
  followers,
}) => {
  return (
    <section className="mt-3 px-2 sm:px-6">
      <div className="w-full rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-[6px]">
        <div className="grid grid-cols-4 divide-x divide-slate-200/80">
          <Item label="Posts" value={posts} />
          <Item label="Total XP" value={totalXp} />
          <Item label="Following" value={following} />
          <Item label="Followers" value={followers} />
        </div>
      </div>
    </section>
  );
};

export default ProfileStatsRow;