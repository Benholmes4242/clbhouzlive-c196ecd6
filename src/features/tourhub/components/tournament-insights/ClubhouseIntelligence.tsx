/**
 * ClubhouseIntelligence - Course breakdown card
 * Light theme with white card and gold accent
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

// Keep interface, use inline prop below

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
      className={inline ? "px-5 pb-5 pt-0 border-t border-border" : "rounded-2xl p-5 bg-card border border-border"}
      style={inline ? undefined : { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      <h3 className="text-base font-bold mb-2.5 text-foreground">
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
