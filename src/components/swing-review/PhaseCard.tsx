import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { SwingPhase } from './SwingReview';

interface PhaseCardProps {
  phase: SwingPhase;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  const [showDetail, setShowDetail] = useState(false);

  const getStatusColor = (status: SwingPhase['status']) => {
    switch (status) {
      case 'strong':
        return 'text-emerald-700';
      case 'tip':
        return 'text-amber-700';
      case 'fix':
        return 'text-red-700';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusChip = (status: SwingPhase['status']) => {
    switch (status) {
      case 'strong':
        return <span className="rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 border border-emerald-100">Strong</span>;
      case 'tip':
        return <span className="rounded-full bg-amber-50 text-amber-700 text-[11px] px-2 py-0.5 border border-amber-100">Tip</span>;
      case 'fix':
        return <span className="rounded-full bg-red-50 text-red-700 text-[11px] px-2 py-0.5 border border-red-100">Fix</span>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl bg-white/95 border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/[0.06]">
        <h3 className="text-[15px] sm:text-[16px] font-semibold text-gray-900">{phase.name}</h3>
        {getStatusChip(phase.status)}
      </div>
      
      <div className="p-0">
        {/* Short looping clip placeholder */}
        <div className="aspect-video bg-black flex items-center justify-center text-sm text-gray-400">
          Phase video clip (1-2s loop)
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 py-4 space-y-3">
          {/* Observation */}
          <div>
            <p className="text-[12px] text-gray-600 mb-1">Observation</p>
            <p className="text-[14px] leading-[1.45] text-gray-800">{phase.observation}</p>
          </div>

          {/* Strength */}
          {phase.strength && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-emerald-700 mb-0.5">Strength</p>
                  <p className="text-[13px] text-emerald-900">{phase.strength}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          {phase.tip && (
            <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-[#2A9D8F] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-gray-700 mb-0.5">Tip</p>
                  <p className="text-[13px] text-gray-700">{phase.tip}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coach notes expandable */}
        <Collapsible open={showDetail} onOpenChange={setShowDetail}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 sm:px-5 py-3 border-t border-black/[0.06] hover:bg-black/[0.02] transition">
              <span className="text-[14px] font-semibold text-gray-900">Coach notes</span>
              {showDetail ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 sm:px-5 pb-4 space-y-2">
              <p className="text-[14px] leading-[1.45] text-gray-800">
                Detailed analysis and coaching notes would appear here when expanded.
              </p>
              <div className="text-[13px] text-gray-700 bg-black/[0.02] rounded px-3 py-2">
                • Recommendation bullet points
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};