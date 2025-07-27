import React from 'react';
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
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-[#6e9277]" />
            My Handicap Performance
          </h3>
        </div>
        <div>
          {currentHandicap !== null ? (
            <>
              <div className="mb-4 p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#6e9277]">
                    {currentHandicap.toFixed(1)}
                  </div>
                  <div className="text-sm text-white/70">Current Handicap</div>
                </div>
              </div>
              <HandicapPerformanceChart />
            </>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-white/50" />
              <p className="text-white/70 mb-2">No handicap data available</p>
              <p className="text-sm text-white/50">
                Connect your handicap service to track performance
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Future Rounds Section */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Calendar className="h-5 w-5 text-[#6e9277]" />
            Recent Rounds
          </h3>
        </div>
        <div>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <p className="text-white/70 mb-2">Round tracking coming soon</p>
            <p className="text-sm text-white/50">
              Track your individual golf rounds and performance metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandicapSection;