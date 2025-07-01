
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Thomas Holmes' handicap performance data from England Golf
const thomasPerformanceData = [
  { round: 1, handicap: 10.8, counting: 10.8, nonCounting: 10.8, history: 9.0 },
  { round: 2, handicap: 11.2, counting: 11.2, nonCounting: 11.2, history: 9.0 },
  { round: 3, handicap: 9.1, counting: 9.1, nonCounting: 9.1, history: 9.0 },
  { round: 4, handicap: 8.6, counting: 8.6, nonCounting: 8.6, history: 8.5 },
  { round: 5, handicap: 8.0, counting: 8.0, nonCounting: 8.0, history: 8.0 },
  { round: 6, handicap: 13.7, counting: 13.7, nonCounting: 13.7, history: 8.0 },
  { round: 7, handicap: 13.5, counting: 13.5, nonCounting: 13.5, history: 8.0 },
  { round: 8, handicap: 14.8, counting: 14.8, nonCounting: 14.8, history: 8.0 },
  { round: 9, handicap: 13.7, counting: 13.7, nonCounting: 13.7, history: 8.0 },
  { round: 10, handicap: 6.0, counting: 6.0, nonCounting: 6.0, history: 8.0 },
  { round: 11, handicap: 6.0, counting: 6.0, nonCounting: 6.0, history: 8.0 },
  { round: 12, handicap: 8.5, counting: 8.5, nonCounting: 8.5, history: 8.0 },
  { round: 13, handicap: 11.6, counting: 11.6, nonCounting: 11.6, history: 7.7 },
  { round: 14, handicap: 10.7, counting: 10.7, nonCounting: 10.7, history: 7.4 },
  { round: 15, handicap: 11.9, counting: 11.9, nonCounting: 11.9, history: 7.4 },
  { round: 16, handicap: 8.4, counting: 8.4, nonCounting: 8.4, history: 7.4 },
  { round: 17, handicap: 12.0, counting: 12.0, nonCounting: 12.0, history: 7.4 },
  { round: 18, handicap: 12.1, counting: 12.1, nonCounting: 12.1, history: 7.4 },
  { round: 19, handicap: 8.0, counting: 8.0, nonCounting: 8.0, history: 7.4 },
  { round: 20, handicap: 7.5, counting: 7.5, nonCounting: 7.5, history: 7.2 },
];

const ThomasHandicapPerformanceChart: React.FC = () => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Handicap Performance</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={thomasPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="round" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              domain={[5, 15]}
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
  );
};

export default ThomasHandicapPerformanceChart;
