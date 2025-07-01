
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import HandicapPerformanceChart from './HandicapPerformanceChart';

const BenjaminHandicapLayout: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Performance Graph - Full Width */}
      <HandicapPerformanceChart />

      {/* My Handicap Card - Stacked Below */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-3">
          <div className="space-y-0">
            {/* Top Row: Title and England Golf Logo */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h4 className="text-red-500 text-sm font-medium mb-0">My Handicap Index®</h4>
                <div className="text-4xl font-bold text-gray-900 mt-1">4.5</div>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <img 
                  src="/lovable-uploads/41a64d83-afc2-42f1-a446-b6a8b45a0043.png" 
                  alt="England Golf" 
                  className="h-12 w-auto opacity-80"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Powered by England Golf</span>
                  <div className="text-xs text-gray-500">
                    Last Updated: Today
                  </div>
                </div>
              </div>
            </div>
            
            {/* Home Club - Compact spacing */}
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Home Club:</span> Sundridge Park
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 100 Profile Header */}
      <div className="mt-6 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">My Top 100 Golf Courses</h2>
        <p className="text-sm text-gray-500">
          Here's how you've ranked the world's best golf courses based on the ones you've played.
        </p>
      </div>
    </div>
  );
};

export default BenjaminHandicapLayout;
