
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Mock data for handicap performance
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

const HandicapPerformanceChart: React.FC = () => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-foreground">My Handicap Performance</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="round" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              domain={[0, 14]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
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
          <span className="text-foreground">Handicap Index®</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-foreground">Counting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-foreground">Non-Counting</span>
        </div>
      </div>

      {/* Score filters */}
      <div className="flex gap-2 mt-4">
        <Badge variant="destructive" className="text-xs">Last 20 Scores</Badge>
        <Badge variant="secondary" className="text-xs">Last 50 Scores</Badge>
        <Badge variant="secondary" className="text-xs">Last 100 Scores</Badge>
      </div>
    </div>
  );
};

export default HandicapPerformanceChart;
