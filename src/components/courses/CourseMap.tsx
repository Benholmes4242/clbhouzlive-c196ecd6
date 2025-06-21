
import React from 'react';
import { MapPin } from 'lucide-react';

interface CourseMapProps {
  latitude: number;
  longitude: number;
  courseName: string;
}

const CourseMap = ({ latitude, longitude, courseName }: CourseMapProps) => {
  return (
    <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border">
      <div className="text-center space-y-2">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">{courseName}</p>
          <p>Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</p>
          <p className="text-xs mt-1">Map integration coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default CourseMap;
