
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users } from 'lucide-react';

interface MapViewProps {
  region: string;
  audience: 'friends' | 'all';
}

const MapView: React.FC<MapViewProps> = ({ region, audience }) => {
  // This is a placeholder for the map implementation
  // In a real implementation, you would integrate with a mapping library like Mapbox
  
  return (
    <Card className="h-96">
      <CardContent className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Interactive Map View</h3>
          <p className="text-gray-500 max-w-md">
            This feature will display Top 100 courses on an interactive map with pins colored by popularity. 
            Click pins to see course details and recent user posts.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Activity</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Activity</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Activity</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapView;
