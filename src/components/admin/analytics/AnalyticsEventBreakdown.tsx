import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface EventBreakdownProps {
  data?: Array<{ name: string; count: number }>;
  loading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AnalyticsEventBreakdown({ data, loading }: EventBreakdownProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const hasData = data && data.length > 0;
  
  // Format data for pie chart - take top 5
  const chartData = (data || []).slice(0, 5).map(item => ({
    name: item.name.replace(/_/g, ' ').replace(/:/g, ': '),
    value: item.count
  }));
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Event Types</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="min-h-[100px] flex items-center justify-center text-muted-foreground">
            <div className="text-center py-4">
              <p className="text-xs">No events recorded yet</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
