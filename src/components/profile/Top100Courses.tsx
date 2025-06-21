
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, MapPin } from 'lucide-react';

interface Top100CoursesProps {
  userId: string;
  isOwnProfile?: boolean;
  top100Visible?: boolean;
}

const Top100Courses: React.FC<Top100CoursesProps> = ({
  userId,
  isOwnProfile = false,
  top100Visible = true
}) => {
  const shouldShowSection = isOwnProfile || top100Visible;

  if (!shouldShowSection) {
    return null;
  }

  return (
    <section className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold">Top 100 Courses</h2>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Course Data Available</h3>
          <p className="text-muted-foreground mb-4">
            All course data has been removed from the system.
          </p>
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Ready for new course data</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Top100Courses;
