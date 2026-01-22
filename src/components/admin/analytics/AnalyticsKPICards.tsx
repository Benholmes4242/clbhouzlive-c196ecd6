import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Users, TrendingUp, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  loading?: boolean;
  suffix?: string;
}

function KPICard({ title, value, change, icon, loading, suffix }: KPICardProps) {
  const isPositive = change >= 0;
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
        </div>
        <p className={cn(
          "text-xs",
          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isPositive ? '+' : ''}{change}% from previous period
        </p>
      </CardContent>
    </Card>
  );
}

interface AnalyticsKPICardsProps {
  data?: {
    totalEvents: { value: number; change: number };
    uniqueUsers: { value: number; change: number };
    eventsPerUser: { value: number; change: number };
    totalPosts: { value: number; change: number };
  };
  loading?: boolean;
}

export function AnalyticsKPICards({ data, loading }: AnalyticsKPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Events"
        value={data?.totalEvents.value ?? 0}
        change={data?.totalEvents.change ?? 0}
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="Unique Users"
        value={data?.uniqueUsers.value ?? 0}
        change={data?.uniqueUsers.change ?? 0}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="Events per User"
        value={data?.eventsPerUser.value ?? 0}
        change={data?.eventsPerUser.change ?? 0}
        icon={<TrendingUp className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="New Posts"
        value={data?.totalPosts.value ?? 0}
        change={data?.totalPosts.change ?? 0}
        icon={<FileText className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
