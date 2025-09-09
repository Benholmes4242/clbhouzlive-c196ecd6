import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaderboardCard({ courseId }: { courseId: string }) {
  // TODO: hook to fetch leaderboard
  const rows = [
    { name: 'Louis G.', xp: 1605 },
    { name: 'Mark T.', xp: 1430 },
    { name: 'Tom P.', xp: 1180 },
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="font-medium">{r.name}</div>
            </div>
            <div className="text-sm text-muted-foreground">{r.xp} XP</div>
          </div>
        ))}
        {/* TODO: See all CTA -> open full leaderboard */}
      </CardContent>
    </Card>
  );
}