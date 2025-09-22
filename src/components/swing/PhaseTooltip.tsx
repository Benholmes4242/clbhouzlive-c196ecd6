import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricRow } from './MetricRow';
import { PhaseData, UsePhaseMetricsResult } from '@/hooks/usePhaseMetrics';
import { METRIC_INFO, getConfidenceLabel, getConfidenceColor, MetricKey, formatMetricValue, gradeMetric } from '@/config/swingMetrics';

interface PhaseTooltipProps {
  phase: PhaseData;
  className?: string;
}

export const PhaseTooltip: React.FC<PhaseTooltipProps> = ({ 
  phase, 
  className = "" 
}) => {
  if (!phase || !phase.conf) return null;
  
  const confidenceLabel = getConfidenceLabel(phase.conf);
  const confidenceColor = getConfidenceColor(phase.conf);

  // Get top 4 metrics for display
  const topMetrics = Object.entries(phase.metrics || {})
    .filter(([key]) => key in METRIC_INFO)
    .slice(0, 4);

  const phaseDisplayName = phase.status === 'done' ? 
    (phase.metrics && Object.keys(phase.metrics).length > 0 ? 
      Object.keys(phase.metrics)[0].replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase()) : 
      'Analysis'
    ) : 'Pending Analysis';

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{phaseDisplayName}</CardTitle>
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 border ${confidenceColor}`}
          >
            {confidenceLabel} ({Math.round((phase.conf || 0) * 100)}%)
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {topMetrics.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Metrics</h4>
            {topMetrics.map(([key, value]) => {
              const metricKey = key as MetricKey;
              const grade = gradeMetric(metricKey, typeof value === 'number' ? value : 0);
              const formattedValue = formatMetricValue(metricKey, typeof value === 'number' ? value : 0);
              
              return (
                <div key={key} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30">
                  <span className="text-xs font-medium">{METRIC_INFO[metricKey]?.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{formattedValue}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      grade === 'good' ? 'bg-emerald-500' : 
                      grade === 'warn' ? 'bg-yellow-500' : 
                      grade === 'bad' ? 'bg-red-500' : 'bg-muted-foreground'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No metrics available</p>
        )}

        {phase.tips && phase.tips.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Primary Tip</h4>
            <p className="text-sm bg-blue-50 text-blue-900 p-2 rounded-md border border-blue-200">
              {phase.tips[0]}
            </p>
          </div>
        )}
        
        {phase.tips && phase.tips.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Additional Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {phase.tips.slice(1, 3).map((tip, index) => (
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