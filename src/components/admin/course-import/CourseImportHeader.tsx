import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Database, Calendar, AlertTriangle } from 'lucide-react';
import { useCourseImportStats } from '@/hooks/admin/useCourseImportStats';
import { format } from 'date-fns';

const CourseImportHeader = () => {
  const { data: stats, isLoading } = useCourseImportStats();

  const statCards = [
    {
      label: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Imported (7 days)',
      value: stats?.recentlyImported || 0,
      icon: Upload,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'Last Import',
      value: stats?.lastImportDate 
        ? format(new Date(stats.lastImportDate), 'MMM d, yyyy')
        : 'Never',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      isText: true,
    },
    {
      label: 'Missing Data',
      value: (stats?.coursesWithoutCoordinates || 0) + (stats?.coursesWithoutImages || 0),
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      subtitle: `${stats?.coursesWithoutCoordinates || 0} no coords, ${stats?.coursesWithoutImages || 0} no images`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Course Import</h1>
        <p className="text-muted-foreground">Bulk import golf courses from Excel or CSV files</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={stat.bgColor}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>
                    {isLoading ? '...' : stat.isText ? stat.value : stat.value.toLocaleString()}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseImportHeader;
