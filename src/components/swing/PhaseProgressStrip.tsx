import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PhaseTooltip } from './PhaseTooltip';
import { usePhaseMetrics } from '@/hooks/usePhaseMetrics';
import { Loader2 } from 'lucide-react';

interface PhaseProgressStripProps {
  sessionId: string | null;
  onPhaseClick?: (phase: string, frameIndex?: number) => void;
  className?: string;
}

export const PhaseProgressStrip: React.FC<PhaseProgressStripProps> = ({
  sessionId,
  onPhaseClick,
  className = ""
}) => {
  const { data: phases, loading } = usePhaseMetrics(sessionId);

  const phaseOrder = [
    'setup',
    'takeaway', 
    'backswing',
    'top',
    'downswing',
    'impact',
    'followThrough'
  ];

  const getPhaseStatus = (phaseName: string) => {
    const phase = phases[phaseName as keyof typeof phases];
    return phase?.status || 'idle';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500 text-white';
      case 'running': return 'bg-blue-500 text-white';
      case 'queued': return 'bg-yellow-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'queued': return <Loader2 className="h-3 w-3" />;
      case 'done': return '✓';
      case 'error': return '✗';
      default: return '';
    }
  };

  const handlePhaseClick = (phaseName: string) => {
    const phase = phases[phaseName as keyof typeof phases];
    if (phase && phase.status === 'done' && onPhaseClick) {
      onPhaseClick(phaseName, phase.usedFrameIndex);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 p-4 bg-muted/30 rounded-lg ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading phase data...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 p-4 bg-muted/30 rounded-lg overflow-x-auto ${className}`}>
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Swing Phases:
        </span>
        
        <div className="flex items-center gap-1">
          {phaseOrder.map((phaseName) => {
            const status = getPhaseStatus(phaseName);
            const phase = phases[phaseName as keyof typeof phases];
            const isClickable = status === 'done' && onPhaseClick;
            
            if (phase && status !== 'idle') {
              return (
                <Tooltip key={phaseName}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 ${getStatusColor(status)} hover:opacity-80 focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                      onClick={() => handlePhaseClick(phaseName)}
                      disabled={!isClickable}
                      tabIndex={0}
                      aria-describedby={`phase-${phaseName}-tooltip`}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(status)}
                        <span className="text-xs capitalize">{phaseName}</span>
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    id={`phase-${phaseName}-tooltip`}
                    align="start"
                  >
                    <PhaseTooltip metrics={phase.metrics} />
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Badge
                key={phaseName}
                variant="outline"
                className={`h-8 px-2 text-xs capitalize ${getStatusColor(status)}`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(status)}
                  {phaseName}
                </span>
              </Badge>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};