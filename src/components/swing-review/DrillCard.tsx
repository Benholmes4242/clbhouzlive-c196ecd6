import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Volume2, CheckCircle2 } from 'lucide-react';
import { SwingDrill } from './SwingReview';

interface DrillCardProps {
  drill: SwingDrill;
}

export const DrillCard: React.FC<DrillCardProps> = ({ drill }) => {
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(drill.steps.length).fill(false)
  );
  const [setsCompleted, setSetsCompleted] = useState(0);

  const handleStepToggle = (index: number) => {
    const newCompleted = [...completedSteps];
    newCompleted[index] = !newCompleted[index];
    setCompletedSteps(newCompleted);
  };

  const allStepsCompleted = completedSteps.every(Boolean);

  return (
    <div className="rounded-2xl bg-white/95 border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/[0.06]">
        <h3 className="text-[15px] sm:text-[16px] font-semibold text-gray-900">
          🎬 {drill.name}
        </h3>
      </div>
      
      <div className="p-0">
        {/* Demo video */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {/* Top overlay gradient */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
          
          <div className="text-center z-10">
            <button className="h-12 w-12 rounded-full bg-white/92 border border-black/10 flex items-center justify-center text-gray-700 hover:bg-white transition shadow-lg">
              <Play className="h-5 w-5 ml-0.5" />
            </button>
            <p className="text-xs text-white/90 mt-2">30-45s demo</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 py-4 space-y-4">
          {/* Steps checklist */}
          <div className="space-y-2">
            <p className="text-[12px] text-gray-600">Steps:</p>
            {drill.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Checkbox
                  id={`step-${index}`}
                  checked={completedSteps[index]}
                  onCheckedChange={() => handleStepToggle(index)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`step-${index}`}
                  className={`text-body-md font-normal leading-relaxed cursor-pointer ${
                    completedSteps[index] ? 'line-through text-gray-500' : 'text-gray-800'
                  }`}
                >
                  {step}
                </label>
              </div>
            ))}
          </div>

          {/* Target feel */}
          <div className="rounded-xl border border-[#2A9D8F]/20 bg-[#2A9D8F]/5 px-3 py-2.5">
            <p className="text-[14px]">
              <span className="font-semibold text-[#2A9D8F]">🧠 Target feel:</span>{' '}
              <span className="text-gray-800">{drill.targetFeel}</span>
            </p>
          </div>

          {/* Goal and logging */}
          <div className="flex items-center justify-between">
            <div className="text-[14px]">
              <p className="font-medium text-gray-900">🔁 Goal: {drill.reps}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded-full border border-black/10 bg-white text-[11px] px-2 py-0.5">
                  Sets: {setsCompleted}/3
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setSetsCompleted(prev => Math.min(prev + 1, 3))}
              disabled={!allStepsCompleted}
              className={`h-9 px-4 rounded-full text-[14px] font-medium transition border ${
                allStepsCompleted 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                  : 'bg-white/70 border-black/10 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Mark Set Complete
            </button>
          </div>

          {/* Optional coach tip audio */}
          <button className="w-full h-9 rounded-full border border-black/10 bg-white text-[14px] text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
            <Volume2 className="h-3 w-3" />
            Coach tip audio (0:22)
          </button>
        </div>
      </div>
    </div>
  );
};