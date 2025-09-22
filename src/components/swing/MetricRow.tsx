import React from 'react';
import { Badge } from '@/components/ui/badge';
import { METRIC_INFO, getMetricState, MetricKey } from '@/config/swingMetrics';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricRowProps {
  metricKey: MetricKey;
  value: number;
  className?: string;
}

export const MetricRow: React.FC<MetricRowProps> = ({ 
  metricKey, 
  value, 
  className = "" 
}) => {
  const metric = METRIC_INFO[metricKey];
  if (!metric) return null;

  const state = getMetricState(metricKey, value);
  const formattedValue = `${value.toFixed(1)}${metric.unit}`;

  const getBadgeVariant = (state: string) => {
    switch (state) {
      case 'good': return 'default';
      case 'warn': return 'secondary';
      case 'bad': return 'destructive';
      default: return 'outline';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'good': return 'text-emerald-600';
      case 'warn': return 'text-yellow-600';
      case 'bad': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{metric.label}</span>
        {metric.info && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{metric.info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${getStateColor(state)}`}>
          {formattedValue}
        </span>
        <Badge 
          variant={getBadgeVariant(state)}
          className="text-xs px-2 py-0.5"
        >
          {state.charAt(0).toUpperCase() + state.slice(1)}
        </Badge>
      </div>
    </div>
  );
};