import React from 'react';
import { CheckCircle, Target, Calendar } from 'lucide-react';
import { SwingAnalysisSummary } from './SwingReview';

interface SummaryCardProps {
  summary: SwingAnalysisSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <div className="rounded-2xl bg-white/95 border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3">
        <div>
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-gray-900">
            {summary.club} – Swing Breakdown
          </h2>
          <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1">
            <Calendar className="h-3 w-3" />
            <span>{summary.date}</span>
            {summary.lie && (
              <>
                <span>•</span>
                <span>{summary.lie}</span>
              </>
            )}
          </div>
        </div>
        {/* Status chip */}
        <span className="rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 border border-emerald-100">
          Analysed
        </span>
      </div>

      {/* Insights grid */}
      <div className="px-4 sm:px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Strengths */}
          {summary.strengths.map((strength, index) => (
            <div 
              key={`strength-${index}`}
              className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                <span className="text-[12px] text-gray-600">Strength</span>
              </div>
              <p className="text-[15px] font-semibold text-gray-900">{strength}</p>
            </div>
          ))}
          
          {/* Priority Fix */}
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] text-gray-600">Priority Fix</span>
            </div>
            <p className="text-[15px] font-semibold text-gray-900">⚠️ {summary.priorityFix}</p>
          </div>
          
          {/* Recommended Drill */}
          <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3 w-3 text-[#2A9D8F]" />
              <span className="text-[12px] text-gray-600">Drill</span>
            </div>
            <p className="text-[15px] font-semibold text-gray-900">{summary.recommendedDrill}</p>
          </div>
        </div>
      </div>

      {/* Coach Verdict */}
      <div className="px-4 sm:px-5 py-3 border-t border-black/[0.06]">
        <p className="text-[14px] text-gray-800">
          <span className="font-semibold">Coach verdict:</span> {summary.verdict}
        </p>
      </div>
    </div>
  );
};