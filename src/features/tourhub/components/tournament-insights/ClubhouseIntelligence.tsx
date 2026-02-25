/**
 * ClubhouseIntelligence - Course breakdown
 * Theme-aware, animated chevron
 */

import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClubhouseIntelligenceProps {
  insight: {
    primaryText: string;
    expandedText?: string;
  };
  inline?: boolean;
}

export const ClubhouseIntelligence = memo(function ClubhouseIntelligence({ 
  insight,
  inline,
}: ClubhouseIntelligenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExpandedContent = !!insight.expandedText;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      viewport={{ once: true }}
      className="px-4 pb-5 pt-0"
    >
      <h3 className="mb-3 text-foreground" style={{ fontSize: '18px', fontWeight: 700 }}>
        Course Breakdown
      </h3>

      <p className="text-sm leading-relaxed m-0 text-muted-foreground">
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
          className="flex items-center gap-1.5 mt-3 text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 transition-opacity duration-200 text-foreground hover:opacity-70 active:opacity-70"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <ChevronDown className="w-3.5 h-3.5 text-foreground" />
          </motion.span>
        </button>
      )}
    </motion.div>
  );
});
