/**
 * ClubhouseIntelligence - Course breakdown
 * Dispatch-style section rule header
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
      style={{ background: '#F8FAFC' }}
    >
      {/* Section rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px', borderBottom: '0.5px solid rgba(15,23,42,0.08)', marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Course Breakdown</span>
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, padding: '0 16px', color: '#475569' }}>
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            padding: '0 16px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#0F172A',
            transition: 'opacity 0.2s',
          }}
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-flex' }}
          >
            <ChevronDown style={{ width: 14, height: 14, color: '#0F172A' }} />
          </motion.span>
        </button>
      )}
    </motion.div>
  );
});
