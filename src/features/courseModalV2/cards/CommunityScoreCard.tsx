import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Bar from '../primitives/Bar';

export default function CommunityScoreCard({ stats }: {
  stats?: { overall?: number; fun?: number; playability?: number; design?: number; }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Community Score</CardTitle>
        <div className="text-4xl font-semibold">{stats?.overall ?? '—'}/10</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Bar label="Fun" value={stats?.fun} />
        <Bar label="Playability" value={stats?.playability} />
        <Bar label="Design" value={stats?.design} />
      </CardContent>
    </Card>
  );
}