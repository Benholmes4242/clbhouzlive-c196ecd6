import React, { useState } from 'react';
import { SummaryCard } from './SummaryCard';
import { PriorityFixBar } from './PriorityFixBar';
import { PhaseStepper } from './PhaseStepper';
import { PhaseCard } from './PhaseCard';
import { DrillCard } from './DrillCard';
import { ActionBar } from './ActionBar';
import { KeyframePlayer } from './KeyframePlayer';

export interface SwingPhase {
  id: string;
  name: string;
  timestamp: number;
  status: 'strong' | 'tip' | 'fix';
  observation: string;
  strength?: string;
  tip?: string;
  thumbnail?: string;
}

export interface SwingDrill {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  steps: string[];
  targetFeel: string;
  reps: string;
}

export interface SwingAnalysisSummary {
  club: string;
  date: string;
  lie?: string;
  strengths: string[];
  priorityFix: string;
  recommendedDrill: string;
  verdict: string;
}

export interface SwingReviewProps {
  videoUrl: string;
  summary: SwingAnalysisSummary;
  phases: SwingPhase[];
  priorityFix: {
    title: string;
    why: string;
    howToFeel: string;
    microTask: string;
  };
  drills: SwingDrill[];
  onShare?: () => void;
  onAddVoiceNote?: () => void;
}

export const SwingReview: React.FC<SwingReviewProps> = ({
  videoUrl,
  summary,
  phases,
  priorityFix,
  drills,
  onShare,
  onAddVoiceNote
}) => {
  const [selectedPhase, setSelectedPhase] = useState(phases[0]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  const handlePhaseSelect = (phase: SwingPhase) => {
    setSelectedPhase(phase);
    setCurrentVideoTime(phase.timestamp);
  };

  const primaryDrill = drills[0];

  return (
    <div className="mx-auto max-w-5xl space-y-4 motion-reduce:transition-none">
      {/* Summary */}
      <SummaryCard summary={summary} />

      {/* Priority Fix */}
      <PriorityFixBar fix={priorityFix} />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Video + Timeline */}
        <div className="space-y-3">
          <KeyframePlayer 
            videoUrl={videoUrl} 
            currentTime={currentVideoTime}
            onTimeUpdate={setCurrentVideoTime}
          />
          <PhaseStepper 
            phases={phases} 
            selectedPhase={selectedPhase}
            onPhaseSelect={handlePhaseSelect}
          />
        </div>

        {/* Right: Phase + Drill */}
        <div className="space-y-3">
          <PhaseCard phase={selectedPhase} />
          {primaryDrill && <DrillCard drill={primaryDrill} />}
        </div>
      </div>

      {/* Footer */}
      <ActionBar
        onShare={onShare}
        onAddVoiceNote={onAddVoiceNote}
      />
    </div>
  );
};