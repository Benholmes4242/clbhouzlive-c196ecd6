
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Database } from 'lucide-react';

const MyCourses = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Course Data Available</h3>
          <p className="text-muted-foreground mb-4">
            All course data has been removed from the system. Course tracking is currently unavailable.
          </p>
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Ready for new course data</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyCourses;
