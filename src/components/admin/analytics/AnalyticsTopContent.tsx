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
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  const hasData = items.length > 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          {React.cloneElement(icon as React.ReactElement, { className: 'h-3 w-3' })}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[140px]">
                  {index + 1}. {item.name}
                </span>
                <span className="font-medium tabular-nums">
                  {item.value.toLocaleString()} {valueLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            No data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsTopContent({ data, loading }: TopContentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
