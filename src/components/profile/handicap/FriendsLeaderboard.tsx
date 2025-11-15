import React from 'react';
import { Squircle } from '@/components/ui/squircle';

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
              <Squircle width={40} height={40}>
                {r.avatarUrl ? (
                  <img src={r.avatarUrl} alt={r.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '16px', fontWeight: 600 }}>
                    {r.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </Squircle>
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