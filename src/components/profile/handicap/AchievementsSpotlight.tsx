import React from 'react';

export default function AchievementsSpotlight({ item }: {
  item?: { id: string; title: string; subtitle?: string; icon: 'trophy' | string; earnedAt: string; isGlowing: boolean }
}) {
  if (!item) return null;
  return (
    <div className="mx-0 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(to right, var(--echo-from), var(--echo-to))' }}>
      {item.isGlowing && <div className="absolute inset-0 opacity-30 animate-pulse bg-white" />}
      <div className="relative">
        <div className="text-sm opacity-90">Achievements</div>
        <div className="text-lg font-semibold">{item.title}</div>
        {item.subtitle && <div className="text-sm opacity-90 mt-1">{item.subtitle}</div>}
      </div>
    </div>
  );
}