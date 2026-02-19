/**
 * ClubhouseIntelligence - Course breakdown
 * Renders flat on page background (no card wrapper)
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
  const [isHovered, setIsHovered] = useState(false);
  const hasExpandedContent = !!insight.expandedText;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      viewport={{ once: true }}
      className="px-4 pb-5 pt-0"
    >
      <h3 className="mb-2.5" style={{ fontSize: '17px', fontWeight: 600, color: '#1C1917' }}>
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex items-center gap-1.5 mt-3 text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 active:opacity-70"
          style={{
            color: isHovered ? '#DAA520' : '#B8860B',
          }}
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
