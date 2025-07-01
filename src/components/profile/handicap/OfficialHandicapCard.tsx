
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import HandicapPerformanceChart from './HandicapPerformanceChart';

interface OfficialHandicapCardProps {
  handicapIndex: number;
  homeClub: string;
  governingBody: string;
  lastUpdated: string;
}

const OfficialHandicapCard: React.FC<OfficialHandicapCardProps> = ({
  handicapIndex,
  homeClub,
  governingBody,
  lastUpdated,
}) => {
  const formatHandicap = (handicap: number) => {
    if (handicap < 0) {
      return `+${Math.abs(handicap)}`;
    }
    return handicap.toString();
  };

  const getGoverningBodyLogo = (body: string) => {
    switch (body) {
      case 'england-golf':
        return '/lovable-uploads/41a64d83-afc2-42f1-a446-b6a8b45a0043.png';
      default:
        return null;
    }
  };

  const getGoverningBodyName = (body: string) => {
    switch (body) {
      case 'england-golf':
        return 'England Golf';
      case 'golf-ireland':
        return 'Golf Ireland';
      case 'usga':
        return 'USGA';
      case 'golf-australia':
        return 'Golf Australia';
      case 'scottish-golf':
        return 'Scottish Golf';
      case 'wales-golf':
        return 'Wales Golf';
      default:
        return body;
    }
  };

  const formatLastUpdated = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Performance Graph */}
      <HandicapPerformanceChart />

      {/* Official Handicap Card */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-red-500 text-sm font-medium">My Handicap Index®</h4>
                <div className="text-4xl font-bold text-gray-900 mt-1">
                  {formatHandicap(handicapIndex)}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  {getGoverningBodyLogo(governingBody) && (
                    <img 
                      src={getGoverningBodyLogo(governingBody)} 
                      alt={getGoverningBodyName(governingBody)} 
                      className="h-6 w-auto opacity-80"
                    />
                  )}
                  <span className="text-xs text-gray-500">
                    Powered by {getGoverningBodyName(governingBody)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Last Updated: {formatLastUpdated(lastUpdated)}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Home Club:</span> {homeClub}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficialHandicapCard;
