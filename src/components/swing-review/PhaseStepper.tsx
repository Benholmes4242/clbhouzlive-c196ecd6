import React from 'react';
import { Button } from '@/components/ui/button';
import { SwingPhase } from './SwingReview';

interface PhaseStepperProps {
  phases: SwingPhase[];
  selectedPhase: SwingPhase;
  onPhaseSelect: (phase: SwingPhase) => void;
}

export const PhaseStepper: React.FC<PhaseStepperProps> = ({
  phases,
  selectedPhase,
  onPhaseSelect
}) => {
  const getStatusColor = (status: SwingPhase['status']) => {
    switch (status) {
      case 'strong':
        return 'border-green-500 bg-green-50';
      case 'tip':
        return 'border-amber-500 bg-amber-50';
      case 'fix':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-muted bg-muted/50';
    }
  };

  const getStatusIcon = (status: SwingPhase['status']) => {
    switch (status) {
      case 'strong':
        return '✅';
      case 'tip':
        return '🟡';
      case 'fix':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-3">Phase Timeline</h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {phases.map((phase, index) => (
          <Button
            key={phase.id}
            variant="ghost"
            size="sm"
            onClick={() => onPhaseSelect(phase)}
            className={`
              flex-none flex flex-col items-center gap-1 p-2 h-auto min-w-16 rounded-lg border-2 transition-all duration-150
              ${selectedPhase.id === phase.id 
                ? `${getStatusColor(phase.status)} ring-2 ring-brand-orange/30` 
                : getStatusColor(phase.status)
              }
              hover:scale-105 motion-reduce:hover:scale-100
            `}
          >
            {/* Thumbnail or icon */}
            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-xs border">
              {phase.thumbnail ? (
                <img 
                  src={phase.thumbnail} 
                  alt={phase.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{getStatusIcon(phase.status)}</span>
              )}
            </div>
            
            {/* Phase name */}
            <span className="text-xs font-medium text-center leading-tight">
              {phase.name}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};