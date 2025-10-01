import React from 'react';
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
        return 'border-emerald-300 bg-emerald-50';
      case 'tip':
        return 'border-amber-300 bg-amber-50';
      case 'fix':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-black/10 bg-white';
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
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => onPhaseSelect(phase)}
            className={`
              flex-none flex flex-col items-center gap-1.5 px-3 py-2 h-auto min-w-[72px] rounded-xl border-2 transition-all
              ${selectedPhase.id === phase.id 
                ? `${getStatusColor(phase.status)} ring-1 ring-[#2A9D8F]/35 shadow-[0_2px_12px_rgba(42,157,143,0.15)]` 
                : getStatusColor(phase.status)
              }
              hover:scale-105 motion-reduce:hover:scale-100
            `}
          >
            {/* Thumbnail or icon */}
            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-xs border border-black/10">
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
            <span className="text-[11px] font-medium text-center leading-tight text-gray-900">
              {phase.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};