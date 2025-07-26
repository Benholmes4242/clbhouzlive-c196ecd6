import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy } from 'lucide-react';

interface HandicapGraphProps {
  userId: string;
}

const HandicapGraph: React.FC<HandicapGraphProps> = ({ userId }) => {
  // Mock handicap data
  const handicapData = [
    { month: 'Jan', handicap: 6.2 },
    { month: 'Feb', handicap: 5.8 },
    { month: 'Mar', handicap: 5.4 },
    { month: 'Apr', handicap: 4.9 },
    { month: 'May', handicap: 4.5 },
    { month: 'Jun', handicap: 4.0 }
  ];

  const recentRounds = [
    {
      id: '1',
      course: 'Walton Heath Golf Club',
      date: '2024-01-15',
      score: 78,
      logo: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=50&h=50&fit=crop'
    },
    {
      id: '2',
      course: 'Royal St Georges',
      date: '2024-01-10',
      score: 82,
      logo: 'https://images.unsplash.com/photo-1559267200-f29d6297a4ac?w=50&h=50&fit=crop'
    },
    {
      id: '3',
      course: 'Sunningdale Golf Club',
      date: '2024-01-05',
      score: 79,
      logo: 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4689?w=50&h=50&fit=crop'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h2 className="text-2xl font-bold text-foreground">Handicap</h2>
      
      {/* Graph */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Handicap Progress</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={handicapData}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="handicap" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Personal Best */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold">Personal Best</h3>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">4.0</div>
          <div className="text-sm text-muted-foreground">Achieved on June 15, 2024</div>
        </div>
      </div>
      
      {/* Recent Rounds */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Rounds</h3>
        <div className="space-y-3">
          {recentRounds.map((round) => (
            <div key={round.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <img
                  src={round.logo}
                  alt={round.course}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-sm">{round.course}</div>
                  <div className="text-xs text-muted-foreground">{round.date}</div>
                </div>
              </div>
              <div className="text-lg font-bold text-primary">{round.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HandicapGraph;