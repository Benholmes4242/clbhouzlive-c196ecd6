/**
 * ClubhouseIntelligence - Dispatch-style course breakdown pull-quote
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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
      style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(15,23,42,0.07)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Course Breakdown
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div>
          <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            {insight.primaryText}
            {isExpanded && insight.expandedText && (
              <><br /><br />{insight.expandedText}</>
            )}
          </p>

          {hasExpandedContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, fontWeight: 700, color: '#0F172A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {isExpanded ? 'Show less' : 'Show more'}
              <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex' }}>
                <ChevronDown style={{ width: 13, height: 13 }} />
              </motion.span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
