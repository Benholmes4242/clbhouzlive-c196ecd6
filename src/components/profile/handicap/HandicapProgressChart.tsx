import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip,
  Area,
  AreaChart
} from 'recharts';

interface HandicapDataPoint {
  date: string;
  handicap: number;
  round: number;
  courseName?: string;
}

interface HandicapProgressChartProps {
  data: HandicapDataPoint[];
  isLoading?: boolean;
}

// Custom tooltip component
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-foreground font-medium">Round #{data.round}</p>
        <p className="text-muted-foreground text-sm">{data.date}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span className="text-foreground">
            Handicap: <span className="font-bold">{data.handicap.toFixed(1)}</span>
          </span>
        </div>
        {data.courseName && (
          <p className="text-muted-foreground text-xs mt-1">{data.courseName}</p>
        )}
      </div>
    );
  }
  return null;
};

const HandicapProgressChart: React.FC<HandicapProgressChartProps> = ({ 
  data, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground text-sm">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">📈</div>
          <p className="text-muted-foreground">No handicap data available</p>
          <p className="text-muted-foreground text-sm">Start recording rounds to see your progress</p>
        </div>
      </div>
    );
  }

  // Calculate domain for Y-axis with some padding
  const handicaps = data.map(d => d.handicap);
  const minHandicap = Math.min(...handicaps);
  const maxHandicap = Math.max(...handicaps);
  const padding = (maxHandicap - minHandicap) * 0.1 || 1;
  const yDomain = [
    Math.max(0, minHandicap - padding), 
    maxHandicap + padding
  ];

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="handicapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)" 
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              dataKey="round"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              tickFormatter={(value) => `R${value}`}
            />
            
            <YAxis 
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
            />
            
            <Area
              type="monotone"
              dataKey="handicap"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#handicapGradient)"
              dot={{ 
                fill: 'hsl(var(--primary))', 
                strokeWidth: 2, 
                r: 4,
                stroke: 'white'
              }}
              activeDot={{ 
                r: 6, 
                stroke: 'white', 
                strokeWidth: 2,
                fill: 'hsl(var(--primary))',
                filter: 'drop-shadow(0 0 6px hsla(var(--primary), 0.6))'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Chart info */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-foreground">Handicap Index</span>
        </div>
        
        <div className="text-muted-foreground text-xs">
          Last {data.length} rounds
        </div>
      </div>
    </div>
  );
};

export default HandicapProgressChart;