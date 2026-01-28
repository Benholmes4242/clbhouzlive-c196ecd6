import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  CheckCircle2, 
  Star, 
  AlertTriangle,
  ImageOff,
  Plus
} from 'lucide-react';
import { useGolfCoursesStats } from '@/hooks/admin/useGolfCoursesStats';
import { Skeleton } from '@/components/ui/skeleton';

export function GolfCoursesHeader() {
  const { data: stats, isLoading } = useGolfCoursesStats();

  const statCards = [
    {
      label: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Ranked Courses',
      value: stats?.verifiedCourses || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'With Ratings',
      value: stats?.coursesWithRatings || 0,
      icon: Star,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Missing Coords',
      value: stats?.missingCoordinates || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      highlight: (stats?.missingCoordinates || 0) > 0,
    },
    {
      label: 'No Images',
      value: stats?.missingImages || 0,
      icon: ImageOff,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      highlight: (stats?.missingImages || 0) > 0,
    },
    {
      label: 'Added (7d)',
      value: stats?.recentlyAdded || 0,
      icon: Plus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((stat) => (
        <Card 
          key={stat.label} 
          className={`border-0 shadow-sm ${stat.highlight ? 'ring-1 ring-red-200' : ''}`}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{stat.value.toLocaleString()}</span>
              {stat.highlight && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                  !
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
