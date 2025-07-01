
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface HandicapCardProps {
  handicapIndex?: number | null;
  egAppConnected: boolean;
  lastUpdated?: string | null;
  trend?: 'up' | 'down' | 'stable';
  isOwnProfile: boolean;
  onEGConnect: () => void;
  userUsername?: string;
}

// Mock data for Benjamin Holmes' handicap performance
const mockPerformanceData = [
  { round: 1, handicap: 7.0, counting: 6.8, nonCounting: 7.2, history: 2.8 },
  { round: 2, handicap: 4.5, counting: 4.3, nonCounting: 4.8, history: 2.8 },
  { round: 3, handicap: 7.8, counting: 7.5, nonCounting: 8.0, history: 2.9 },
  { round: 4, handicap: 2.5, counting: 2.3, nonCounting: 2.8, history: 2.9 },
  { round: 5, handicap: 10.3, counting: 10.0, nonCounting: 10.5, history: 3.0 },
  { round: 6, handicap: 6.5, counting: 6.2, nonCounting: 6.8, history: 3.1 },
  { round: 7, handicap: 12.1, counting: 11.8, nonCounting: 12.3, history: 3.2 },
  { round: 8, handicap: 5.8, counting: 5.5, nonCounting: 6.0, history: 3.3 },
  { round: 9, handicap: 9.2, counting: 8.9, nonCounting: 9.5, history: 3.4 },
  { round: 10, handicap: 7.0, counting: 6.7, nonCounting: 7.3, history: 3.5 },
  { round: 11, handicap: 4.2, counting: 3.9, nonCounting: 4.5, history: 3.6 },
  { round: 12, handicap: 10.5, counting: 10.2, nonCounting: 10.8, history: 3.7 },
  { round: 13, handicap: 2.3, counting: 2.0, nonCounting: 2.6, history: 3.8 },
  { round: 14, handicap: 7.5, counting: 7.2, nonCounting: 7.8, history: 3.9 },
  { round: 15, handicap: 9.8, counting: 9.5, nonCounting: 10.1, history: 4.0 },
  { round: 16, handicap: 6.3, counting: 6.0, nonCounting: 6.6, history: 4.0 },
  { round: 17, handicap: 4.0, counting: 3.7, nonCounting: 4.3, history: 4.0 },
  { round: 18, handicap: 11.2, counting: 10.9, nonCounting: 11.5, history: 4.0 },
  { round: 19, handicap: 8.7, counting: 8.4, nonCounting: 9.0, history: 4.0 },
  { round: 20, handicap: 9.6, counting: 9.3, nonCounting: 9.9, history: 4.0 },
];

const HandicapCard: React.FC<HandicapCardProps> = ({
  handicapIndex,
  egAppConnected,
  lastUpdated,
  trend = 'stable',
  isOwnProfile,
  onEGConnect,
  userUsername
}) => {
  const [showGoverningBodySelect, setShowGoverningBodySelect] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedGoverningBody, setSelectedGoverningBody] = useState('');
  const [manualHandicap, setManualHandicap] = useState('');

  const formatHandicap = (handicap: number) => {
    if (handicap < 0) {
      return `+${Math.abs(handicap)}`;
    }
    return handicap.toString();
  };

  const formatLastUpdated = (date?: string | null) => {
    if (!date) return 'Never updated';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if this is Benjamin Holmes' profile
  const isBenjaminHolmes = userUsername === 'benjaminholmes';

  const renderBenjaminHandicapLayout = () => (
    <div className="space-y-6 p-6">
      {/* Performance Graph - Full Width */}
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4">My Handicap Performance</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="round" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                domain={[0, 14]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Line 
                type="monotone" 
                dataKey="history" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                name="Handicap Index®"
              />
              <Line 
                type="monotone" 
                dataKey="counting" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                name="Counting"
              />
              <Line 
                type="monotone" 
                dataKey="nonCounting" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                name="Non-Counting"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Handicap Index®</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Counting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Non-Counting</span>
          </div>
        </div>

        {/* Score filters */}
        <div className="flex gap-2 mt-4">
          <Badge variant="destructive" className="text-xs">Last 20 Scores</Badge>
          <Badge variant="secondary" className="text-xs">Last 50 Scores</Badge>
          <Badge variant="secondary" className="text-xs">Last 100 Scores</Badge>
        </div>
      </div>

      {/* My Handicap Card - Stacked Below */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-4 pb-3">
          <div className="space-y-2">
            {/* Top Row: Title and England Golf Logo */}
            <div className="flex items-center justify-between">
              <h4 className="text-red-500 text-sm font-medium">My Handicap Index®</h4>
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/41a64d83-afc2-42f1-a446-b6a8b45a0043.png" 
                  alt="England Golf" 
                  className="h-8 w-auto opacity-80"
                />
                <span className="text-xs text-gray-500">Powered by England Golf</span>
              </div>
            </div>
            
            {/* Last Updated - Tight to England Golf */}
            <div className="text-xs text-gray-500 text-right -mt-1">
              Last Updated: Today
            </div>
            
            {/* Main Handicap Value - Tight to title */}
            <div className="text-4xl font-bold text-gray-900 -mt-1">4.5</div>
            
            {/* Home Club - Compact spacing */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">Home Club:</span> Sundridge Park
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStandardHandicapCard = () => (
    <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Handicap Index</h3>
          {handicapIndex !== null && handicapIndex !== undefined && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="text-lg font-bold px-3 py-1 bg-white border-green-300"
              >
                {formatHandicap(handicapIndex)}
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
              <div className="space-y-3">
                {!showGoverningBodySelect && !showManualEntry && (
                  <>
                    <Button 
                      onClick={() => setShowGoverningBodySelect(true)}
                      className="w-full bg-green-600 hover:bg-green-700 mb-2"
                    >
                      Connect Official Handicap
                    </Button>
                    <Button 
                      onClick={() => setShowManualEntry(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Or Add Manual Handicap
                    </Button>
                  </>
                )}

                {showGoverningBodySelect && (
                  <div className="space-y-3">
                    <Select value={selectedGoverningBody} onValueChange={setSelectedGoverningBody}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose your governing body" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="england-golf">England Golf</SelectItem>
                        <SelectItem value="golf-ireland">Golf Ireland</SelectItem>
                        <SelectItem value="usga">USGA</SelectItem>
                        <SelectItem value="golf-australia">Golf Australia</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          // Handle official handicap connection
                          onEGConnect();
                          setShowGoverningBodySelect(false);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!selectedGoverningBody}
                      >
                        Connect
                      </Button>
                      <Button 
                        onClick={() => setShowGoverningBodySelect(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {showManualEntry && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="manual-handicap" className="text-sm font-medium">
                        Enter your handicap
                      </Label>
                      <Input
                        id="manual-handicap"
                        type="number"
                        step="0.1"
                        placeholder="e.g. 4.5"
                        value={manualHandicap}
                        onChange={(e) => setManualHandicap(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          // Handle manual handicap save
                          console.log('Save manual handicap:', manualHandicap);
                          setShowManualEntry(false);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!manualHandicap}
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={() => setShowManualEntry(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Benjamin's special layout or standard card
  if (isBenjaminHolmes && (handicapIndex !== null && handicapIndex !== undefined)) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        {renderBenjaminHandicapLayout()}
      </div>
    );
  }

  return renderStandardHandicapCard();
};

export default HandicapCard;
