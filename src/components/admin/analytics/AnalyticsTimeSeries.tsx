import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeSeriesProps {
  data?: Array<{ date: string; events: number; users: number; posts: number }>;
  loading?: boolean;
}

export function AnalyticsTimeSeries({ data, loading }: TimeSeriesProps) {
  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  const hasData = data && data.length > 0 && data.some(d => d.events > 0 || d.posts > 0);
  
  // Format data for chart
  const chartData = (data || []).map(point => ({
    ...point,
    dateLabel: format(parseISO(point.date), 'MMM d')
  }));
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Activity Over Time</CardTitle>
        {hasData && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span className="text-muted-foreground">Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
              <span className="text-muted-foreground">Posts</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="events" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name="Events"
                />
                <Line 
                  type="monotone" 
                  dataKey="posts" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                  name="Posts"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No activity data available</p>
              <p className="text-xs mt-1">Activity will be tracked as users engage with the platform</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
