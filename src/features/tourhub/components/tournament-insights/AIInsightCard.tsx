/**
 * AIInsightCard - Chapter 3: The Edge (AI narrative insight)
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';

interface AIInsightCardProps {
  edge: {
    headline: string;
    summaryLines: string[];
    expanded?: {
      bullets: string[];
      supportingStats?: Array<{ label: string; value: string }>;
    };
  };
}

export const AIInsightCard = memo(function AIInsightCard({ edge }: AIInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExpandedContent = edge.expanded && edge.expanded.bullets.length > 0;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-[0_12px_35px_rgba(15,23,42,0.10)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">{edge.headline}</h3>

        {/* AI Badge */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
          <Sparkles className="w-3 h-3" />
          <span className="text-xs font-medium">AI</span>
        </span>
      </div>

      {/* Summary Lines */}
      <div className="space-y-2 mb-3">
        {edge.summaryLines.map((line, i) => (
          <p key={i} className="text-sm text-slate-600 leading-relaxed">
            {line}
          </p>
        ))}
      </div>

      {/* Expand Button */}
      {hasExpandedContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Less' : 'Why?'}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && edge.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-slate-200">
              {/* Bullets */}
              <ul className="space-y-2">
                {edge.expanded.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-indigo-500 mt-1">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>

              {/* Supporting Stats (optional) */}
              {edge.expanded.supportingStats && edge.expanded.supportingStats.length > 0 && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
                  {edge.expanded.supportingStats.slice(0, 2).map((stat, i) => (
                    <div key={i}>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
