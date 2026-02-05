/**
 * ClubhouseIntelligence - Course breakdown card
 * Dark glass treatment with gold accent "Show more"
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
  insight 
}: ClubhouseIntelligenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExpandedContent = !!insight.expandedText;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      viewport={{ once: true }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <h3 className="text-base font-bold text-white mb-2.5">
        Course Breakdown
      </h3>

      <p className="text-sm leading-relaxed text-white/60 m-0">
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
          className="flex items-center gap-1.5 mt-3 text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 transition-colors duration-200"
          style={{
            color: '#FFB800',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD700')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#FFB800')}
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      )}
    </motion.div>
  );
});
