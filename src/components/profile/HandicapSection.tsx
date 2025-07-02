import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Trophy } from 'lucide-react';
import HandicapPerformanceChart from './handicap/HandicapPerformanceChart';

interface HandicapSectionProps {
  userId: string;
  profile: any;
}

const HandicapSection: React.FC<HandicapSectionProps> = ({ userId, profile }) => {
  const currentHandicap = profile?.eg_handicap_index || null;

  return (
    <div className="space-y-6">
      {/* Handicap Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#6e9277]" />
            My Handicap Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentHandicap !== null ? (
            <>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#6e9277]">
                    {currentHandicap.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Handicap</div>
                </div>
              </div>
              <HandicapPerformanceChart />
            </>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No handicap data available</p>
              <p className="text-sm text-muted-foreground">
                Connect your handicap service to track performance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Rounds Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#6e9277]" />
            Recent Rounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">Round tracking coming soon</p>
            <p className="text-sm text-muted-foreground">
              Track your individual golf rounds and performance metrics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandicapSection;