
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface HandicapCardProps {
  handicapIndex?: number | null;
  egAppConnected: boolean;
  lastUpdated?: string | null;
  trend?: 'up' | 'down' | 'stable';
  isOwnProfile: boolean;
  onEGConnect: () => void;
}

const HandicapCard: React.FC<HandicapCardProps> = ({
  handicapIndex,
  egAppConnected,
  lastUpdated,
  trend = 'stable',
  isOwnProfile,
  onEGConnect
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatLastUpdated = (date?: string | null) => {
    if (!date) return 'Never updated';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Handicap Index</h3>
          {handicapIndex !== null && handicapIndex !== undefined && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <Badge 
                variant="outline" 
                className="text-lg font-bold px-3 py-1 bg-white border-green-300"
              >
                {handicapIndex > 0 ? '+' : ''}{handicapIndex}
              </Badge>
            </div>
          )}
        </div>

        {handicapIndex !== null && handicapIndex !== undefined ? (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              Last updated: {formatLastUpdated(lastUpdated)}
            </div>
            
            {!egAppConnected && isOwnProfile && (
              <Button 
                onClick={onEGConnect}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Connect EG App for Auto Updates
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">
              {isOwnProfile ? 'Connect your handicap to showcase your skill level' : 'No handicap information available'}
            </p>
            {isOwnProfile && (
              <Button 
                onClick={onEGConnect}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Handicap
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HandicapCard;
