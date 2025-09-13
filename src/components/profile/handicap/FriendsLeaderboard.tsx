import React from 'react';

type Row = { userId: string; displayName: string; avatarUrl: string; monthDelta: number; rank: number };

export default function FriendsLeaderboard({ rows }: { rows: Row[] }) {
  return (
    <div className="mx-0 sm:mx-0">
      <div className="bg-muted border border-border rounded-lg p-4 mx-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Top Friends This Month</h3>
          <span className="text-xs text-muted-foreground">By Handicap Drop</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map(r => (
            <li key={r.userId} className="flex items-center gap-3 py-3">
              <span className="w-6 text-sm font-semibold">{r.rank}</span>
              <img src={r.avatarUrl} className="h-8 w-8 rounded-full" alt={r.displayName} />
              <div className="flex-1">
                <div className="text-sm font-medium">{r.displayName}</div>
              </div>
              <div className={`text-sm font-semibold ${r.monthDelta < 0 ? 'text-emerald-600' : r.monthDelta > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {r.monthDelta > 0 ? `+${r.monthDelta.toFixed(1)}` : r.monthDelta.toFixed(1)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}