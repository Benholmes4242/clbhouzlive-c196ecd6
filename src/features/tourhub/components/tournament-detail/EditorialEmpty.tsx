/**
 * EditorialEmpty — story-driven empty state for tournament detail tabs.
 *
 * Visual: white card with 3px amber rail on the left edge.
 *   - eyebrow  10.5px / 800 / amber-ink uppercase
 *   - title    18px   / 800 / slate-900
 *   - body     13px   / 500 / slate-600
 *   - accent   amber-wash pill below body (optional — omit gracefully)
 *
 * Replaces the generic "Coming Soon" pattern across Upcoming / Live / Completed
 * tabs with editorial copy specific to the moment.
 */

import { motion } from 'framer-motion';

export interface EditorialEmptyProps {
  eyebrow: string;
  title: string;
  body: string;
  accent?: string;
}

export function EditorialEmpty({ eyebrow, title, body, accent }: EditorialEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(15,23,42,0.07)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        marginTop: '8px',
        padding: '18px 20px 20px',
        borderLeft: '3px solid #F7931E',
      }}
    >
      <div
        style={{
          fontSize: '10.5px',
          fontWeight: 800,
          color: '#F7931E',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#475569',
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        {body}
      </p>
      {accent && (
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.28)',
              fontSize: 11,
              fontWeight: 700,
              color: '#B45309',
              letterSpacing: '0.01em',
            }}
          >
            {accent}
          </span>
        </div>
      )}
    </motion.div>
  );
}
