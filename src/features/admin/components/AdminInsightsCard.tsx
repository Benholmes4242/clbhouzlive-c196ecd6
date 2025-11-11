import React from 'react';
import { useAdminInsights } from '../hooks/useAdminInsights';
import { BarChart3, MessageSquare, Share2, Users, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminInsightsCard({ days = 30, className }: { days?: number; className?: string }) {
  const { data, isLoading, isError, refetch } = useAdminInsights(days);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 size={18} /> Echo Insights (last {days}d)
        </CardTitle>
        <button
          onClick={() => refetch()}
          className="text-sm px-2 py-1 rounded-md border border-white/10 hover:bg-white/10"
          aria-label="Refresh insights"
        >
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="h-32 animate-pulse bg-white/5 rounded" />}
        {isError && <p className="text-sm opacity-60">Couldn't load insights.</p>}

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Metric
              icon={<MessageSquare />}
              label="Conversations"
              value={data.conv_total}
              sub={`+${data.conv_24h} last ${days}d`}
            />
            <Metric icon={<Users />} label="Active users" value={data.users_active} />
            <Metric icon={<Share2 />} label="Active shares" value={data.shares_active} />
            <Metric icon={<Download />} label="Exports" value={data.export_count} />
            <div className="col-span-2">
              <div className="text-xs uppercase tracking-wide mb-2 opacity-60">Top tags</div>
              {data.tags.length === 0 ? (
                <div className="opacity-60 text-sm">—</div>
              ) : (
                <ul className="flex flex-wrap gap-4">
                  {data.tags.map((t) => (
                    <li key={t.name} className="text-sm opacity-80">
                      <span className="opacity-90">#{t.name}</span>
                      <span className="opacity-60"> · {t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div role="group" aria-label={label}>
      <div className="flex items-center gap-2 opacity-80 text-sm mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}
