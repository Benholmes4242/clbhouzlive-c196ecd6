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
  currentValue?: number;
  previousValue?: number;
}

function KPICard({ title, value, change, icon, loading, suffix, currentValue = 0, previousValue = 0 }: KPICardProps) {
  const isPositive = change >= 0;
  // Hide trend if both current and previous are 0, or if change is 0
  const showTrend = !(currentValue === 0 && previousValue === 0) && change !== 0;
  
  if (loading) {
    return (
      <Card className="p-3 sm:p-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
        </CardHeader>
        <CardContent className="p-0 pt-1">
          <Skeleton className="h-6 w-14 mb-1" />
          <Skeleton className="h-2 w-20" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{React.cloneElement(icon as React.ReactElement, { className: 'h-3 w-3 sm:h-4 sm:w-4' })}</div>
      </CardHeader>
      <CardContent className="p-0 pt-1">
        <div className="text-xl sm:text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>}
        </div>
        {showTrend ? (
          <p className={cn(
            "text-[10px] sm:text-xs",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {isPositive ? '+' : ''}{change}% from previous period
          </p>
        ) : (
          <p className="text-[10px] sm:text-xs text-muted-foreground/60">
            No change
          </p>
        )}
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <KPICard
        title="Total Events"
        value={data?.totalEvents.value ?? 0}
        change={data?.totalEvents.change ?? 0}
        currentValue={data?.totalEvents.value ?? 0}
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="Unique Users"
        value={data?.uniqueUsers.value ?? 0}
        change={data?.uniqueUsers.change ?? 0}
        currentValue={data?.uniqueUsers.value ?? 0}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="Events per User"
        value={data?.eventsPerUser.value ?? 0}
        change={data?.eventsPerUser.change ?? 0}
        currentValue={data?.eventsPerUser.value ?? 0}
        icon={<TrendingUp className="h-4 w-4" />}
        loading={loading}
      />
      <KPICard
        title="New Posts"
        value={data?.totalPosts.value ?? 0}
        change={data?.totalPosts.change ?? 0}
        currentValue={data?.totalPosts.value ?? 0}
        icon={<FileText className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
