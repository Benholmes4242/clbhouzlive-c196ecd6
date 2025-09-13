import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import HandicapPerformanceChart from './HandicapPerformanceChart';

interface EnhancedHandicapLayoutProps {
  handicapIndex: number;
  homeClub?: string;
  governingBody?: string;
  lastUpdated?: string;
}

const EnhancedHandicapLayout: React.FC<EnhancedHandicapLayoutProps> = ({
  handicapIndex,
  homeClub = 'Sundridge Park',
  governingBody = 'England Golf',
  lastUpdated = 'Today'
}) => {
  return (
    <div className="space-y-6 p-6">
      {/* Performance Graph - Full Width */}
      <HandicapPerformanceChart />

      {/* My Handicap Card - Stacked Below */}
      <Card className="bg-black/20 backdrop-blur-sm border border-white/30 rounded-full shadow-lg">
        <CardContent className="p-3">
          <div className="space-y-0">
            {/* Top Row: Title and England Golf Logo */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h4 className="text-red-500 text-sm font-medium mb-0">My Handicap Index®</h4>
                <div className="text-4xl font-bold text-gray-900 mt-1">{handicapIndex}</div>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <img 
                  src="/lovable-uploads/41a64d83-afc2-42f1-a446-b6a8b45a0043.png" 
                  alt={governingBody} 
                  className="h-12 w-auto opacity-80"
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Powered by {governingBody}</span>
                  <div className="text-xs text-gray-500">
                    Last Updated: {lastUpdated}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Home Club - Compact spacing */}
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Home Club:</span> {homeClub}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedHandicapLayout;