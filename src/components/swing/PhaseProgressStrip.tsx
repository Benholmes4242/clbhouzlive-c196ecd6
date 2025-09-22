import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { PhaseName, PhaseState } from '@/types/swingSession';

interface PhaseProgressStripProps {
  phases: Record<PhaseName, PhaseState>;
  order: PhaseName[];
  className?: string;
}

const phaseLabels: Record<PhaseName, string> = {
  setup: 'Setup',
  takeaway: 'Takeaway', 
  backswing: 'Backswing',
  top: 'Top',
  downswing: 'Downswing',
  impact: 'Impact',
  followThrough: 'Follow-through'
};

const getStatusIcon = (status: PhaseState['status']) => {
  switch (status) {
    case 'idle':
      return <div className="w-4 h-4 rounded-full bg-muted border-2 border-muted-foreground" />;
    case 'queued':
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case 'done':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-muted" />;
  }
};

const getStatusColor = (status: PhaseState['status']) => {
  switch (status) {
    case 'idle':
      return 'bg-muted text-muted-foreground';
    case 'queued':
      return 'bg-muted text-muted-foreground';
    case 'running':
      return 'bg-primary text-primary-foreground';
    case 'done':
      return 'bg-green-500 text-white';
    case 'error':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const PhaseProgressStrip: React.FC<PhaseProgressStripProps> = ({
  phases,
  order,
  className = ""
}) => {
  return (
    <div className={`flex flex-wrap gap-2 p-4 bg-card border rounded-lg ${className}`}>
      {order.map((phase) => {
        const phaseState = phases[phase];
        const label = phaseLabels[phase];
        
        return (
          <div key={phase} className="flex items-center gap-2">
            {getStatusIcon(phaseState.status)}
            <Badge 
              variant="outline" 
              className={`${getStatusColor(phaseState.status)} text-xs`}
            >
              {label}
            </Badge>
            {phaseState.metrics?.conf && (
              <span className="text-xs text-muted-foreground">
                {Math.round(phaseState.metrics.conf * 100)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};