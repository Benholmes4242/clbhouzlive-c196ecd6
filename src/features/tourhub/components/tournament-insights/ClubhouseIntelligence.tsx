/**
 * ClubhouseIntelligence - AI-powered course & player insights
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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
      {/* Header - no AI badge */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">Clubhouse Intelligence</h3>
      </div>

      {/* Primary Insight */}
      <p className="text-sm text-slate-600 leading-relaxed mb-3">
        {insight.primaryText}
      </p>

      {/* Show more / Show less toggle */}
      {hasExpandedContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Show less' : 'Show more'}</span>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
      )}

      {/* Expanded Content - Second paragraph */}
      <AnimatePresence>
        {isExpanded && insight.expandedText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-slate-600 leading-relaxed pt-3 mt-3 border-t border-slate-100">
              {insight.expandedText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
