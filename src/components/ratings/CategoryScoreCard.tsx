import React from 'react';

interface CategoryScoreCardProps {
  label: string;
  user?: number | null;
  community?: number | null;
}

export const CategoryScoreCard: React.FC<CategoryScoreCardProps> = ({ 
  label, 
  user, 
  community 
}) => {
  const hasUser = typeof user === 'number';
  const hasCommunity = typeof community === 'number';

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 px-4 py-3 flex flex-col gap-2 shadow-sm">
      <p className="text-sm font-medium text-slate-900">{label}</p>

      {/* Pills row */}
      <div className="flex items-center gap-2">
        {/* You pill */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              You
            </span>
            {hasUser && (
              <span className="text-xs font-semibold text-slate-900">
                {user!.toFixed(1)}
              </span>
            )}
          </div>
          <div className="h-6 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-[width] duration-300 ease-out"
              style={{ width: hasUser ? `${(user! / 10) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Community pill */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Community
            </span>
            {hasCommunity && (
              <span className="text-xs font-semibold text-slate-900">
                {community!.toFixed(1)}
              </span>
            )}
          </div>
          <div className="h-6 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-slate-700 rounded-full transition-[width] duration-300 ease-out"
              style={{ width: hasCommunity ? `${(community! / 10) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
