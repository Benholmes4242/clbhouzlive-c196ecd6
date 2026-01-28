import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Building2, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useVerificationQueueStats } from '@/hooks/admin/useVerificationQueueStats';

export function VerificationQueueHeader() {
  const { data: stats, isLoading } = useVerificationQueueStats();

  const statCards = [
    {
      label: 'Total Pending',
      value: stats?.totalPending ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Business Pending',
      value: stats?.businessPending ?? 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Golfer Pending',
      value: stats?.golferPending ?? 0,
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Approved Today',
      value: stats?.approvedToday ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Rejected Today',
      value: stats?.rejectedToday ?? 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Verification Queue</h1>
        <p className="text-muted-foreground text-sm hidden md:block">
          Review and verify businesses and people to help golfers identify trusted accounts.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-lg md:text-xl font-semibold">{stat.value}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
