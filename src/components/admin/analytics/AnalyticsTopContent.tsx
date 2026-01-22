import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, User } from 'lucide-react';

interface TopContentProps {
  data?: {
    mostViewedPosts: Array<{ id: string; title: string; views: number }>;
    mostReviewedCourses: Array<{ id: string; name: string; reviews: number }>;
    mostActiveUsers: Array<{ id: string; username: string; actions: number }>;
  };
  loading?: boolean;
}

function ContentList({ 
  title, 
  items, 
  icon, 
  valueLabel,
  loading 
}: { 
  title: string; 
  items: Array<{ id: string; name: string; value: number }>;
  icon: React.ReactNode;
  valueLabel: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  const hasData = items.length > 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[180px]">
                  {index + 1}. {item.name}
                </span>
                <span className="font-medium tabular-nums">
                  {item.value.toLocaleString()} {valueLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsTopContent({ data, loading }: TopContentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ContentList
        title="Top Posts"
        items={(data?.mostViewedPosts || []).map(p => ({ 
          id: p.id, 
          name: p.title, 
          value: p.views 
        }))}
        icon={<Heart className="h-4 w-4" />}
        valueLabel="likes"
        loading={loading}
      />
      <ContentList
        title="Most Reviewed Courses"
        items={(data?.mostReviewedCourses || []).map(c => ({ 
          id: c.id, 
          name: c.name, 
          value: c.reviews 
        }))}
        icon={<MessageSquare className="h-4 w-4" />}
        valueLabel="reviews"
        loading={loading}
      />
      <ContentList
        title="Most Active Users"
        items={(data?.mostActiveUsers || []).map(u => ({ 
          id: u.id, 
          name: u.username, 
          value: u.actions 
        }))}
        icon={<User className="h-4 w-4" />}
        valueLabel="posts"
        loading={loading}
      />
    </div>
  );
}
