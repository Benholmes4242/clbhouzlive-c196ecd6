/**
 * ClubhouseIntelligence - Course breakdown card
 */

import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ClubhouseIntelligenceProps {
  insight: {
    primaryText: string;
    expandedText?: string;
  };
  inline?: boolean;
}

export const ClubhouseIntelligence = memo(function ClubhouseIntelligence({ 
  insight 
}: ClubhouseIntelligenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExpandedContent = !!insight.expandedText;

  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
        Course Breakdown
      </h3>

      <p className="text-[13.5px] leading-relaxed text-slate-500 m-0">
        {insight.primaryText}
        {isExpanded && insight.expandedText && (
          <>
            <br /><br />
            {insight.expandedText}
          </>
        )}
      </p>

      {hasExpandedContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 mt-2.5 text-[13px] font-semibold text-amber-700 bg-transparent border-none cursor-pointer p-0 hover:text-amber-800 transition-colors"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
});
