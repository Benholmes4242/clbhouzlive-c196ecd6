/**
 * ClubhouseIntelligence - AI-powered course & player insights
 */

import { memo, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ClubhouseIntelligenceProps {
  insight: {
    primaryText: string;
    expandedText?: string;
  };
  /** When true, renders content only without card wrapper */
  inline?: boolean;
}

const InsightContent = memo(function InsightContent({ 
  insight 
}: { 
  insight: ClubhouseIntelligenceProps['insight'];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExpandedContent = !!insight.expandedText;

  return (
    <>
      {/* Header with info tooltip */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">Clbhouz Intelligence</h3>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="About Clbhouz Intelligence"
              >
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              className="max-w-[260px] text-xs bg-slate-900 text-white border-0"
            >
              <p>
                AI-powered insights combining course history, player statistics, and real-time research to identify who's most likely to contend this week.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Primary Text - 2 lines when collapsed, full when expanded */}
      <p className={`text-sm text-slate-600 leading-relaxed ${!isExpanded && hasExpandedContent ? 'line-clamp-2' : ''}`}>
        {insight.primaryText}
      </p>

      {/* Expanded Content - Second paragraph (only when expanded) */}
      {isExpanded && insight.expandedText && (
        <p className="text-sm text-slate-600 leading-relaxed mt-3">
          {insight.expandedText}
        </p>
      )}

      {/* Toggle Button - Always at the bottom */}
      {hasExpandedContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors mt-3"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Show less' : 'Show more'}</span>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
      )}
    </>
  );
});

export const ClubhouseIntelligence = memo(function ClubhouseIntelligence({ 
  insight, 
  inline = false 
}: ClubhouseIntelligenceProps) {
  // Inline mode: content only, no card wrapper
  if (inline) {
    return <InsightContent insight={insight} />;
  }

  // Card mode: full card with wrapper
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-[0_12px_35px_rgba(15,23,42,0.10)] p-4">
      <InsightContent insight={insight} />
    </div>
  );
});
