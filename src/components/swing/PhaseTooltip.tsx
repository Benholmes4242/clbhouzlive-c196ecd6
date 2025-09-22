import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricRow } from './MetricRow';
import { PhaseData } from '@/hooks/usePhaseMetrics';
import { METRIC_INFO, getConfidenceLabel, getConfidenceColor, MetricKey } from '@/config/swingMetrics';

interface PhaseTooltipProps {
  phase: PhaseData;
  className?: string;
}

export const PhaseTooltip: React.FC<PhaseTooltipProps> = ({ 
  phase, 
  className = "" 
}) => {
  const confidenceLabel = getConfidenceLabel(phase.confidence);
  const confidenceColor = getConfidenceColor(phase.confidence);

  // Get top 4 metrics for display
  const topMetrics = Object.entries(phase.metrics)
    .filter(([key]) => key in METRIC_INFO)
    .slice(0, 4);

  const phaseDisplayName = phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1);

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{phaseDisplayName}</CardTitle>
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 border ${confidenceColor}`}
          >
            {confidenceLabel} ({(phase.confidence * 100).toFixed(0)}%)
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {topMetrics.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Metrics</h4>
            {topMetrics.map(([key, value]) => (
              <MetricRow 
                key={key}
                metricKey={key as MetricKey}
                value={typeof value === 'number' ? value : 0}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No metrics available</p>
        )}

        {phase.tips.primary && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Primary Tip</h4>
            <p className="text-sm bg-blue-50 text-blue-900 p-2 rounded-md border border-blue-200">
              {phase.tips.primary}
            </p>
          </div>
        )}
        
        {phase.tips.secondary && phase.tips.secondary.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Additional Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {phase.tips.secondary.slice(0, 2).map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};