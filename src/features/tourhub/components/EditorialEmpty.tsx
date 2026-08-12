/**
 * EditorialEmpty — story-driven empty state for tournament detail tabs.
 *
 * Visual language matches the course-detail empty states (HolesEmptyState,
 * ChampionsEmptyState): centred squircle icon-tile → amber dot-eyebrow →
 * 20px/800 ink headline → slate body → optional amber accent pill.
 *
 * Shared by TeeTimesTab, HoleStatsTab, LiveOverviewTab, SummaryTab, and the
 * leaderboard empty in TournamentDetailPage.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { EmptyStateTile } from '@/components/profile/handicap/gam/_shared/EmptyStateTile';
import { AMBER_TINT_10, FONT, INK, INK_SOFT } from '../_shared/tokens';

const DEEP_AMBER = '#B45309';

export interface EditorialEmptyProps {
  eyebrow: string;
  title: string;
  body: string;
  accent?: string;
  /** lucide icon element, e.g. <Trophy size={28} strokeWidth={1.8} color={AMBER} /> */
  icon?: React.ReactNode;
  /** tile tint — amber for active/on-mission, slate for terminal "not available" states */
  tint?: 'amber' | 'slate';
}

export function EditorialEmpty({
  eyebrow,
  title,
  body,
  accent,
  icon,
  tint = 'amber',
}: EditorialEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '40px 28px 48px',
        textAlign: 'center',
        fontFamily: FONT,
      }}
    >
      {icon && <EmptyStateTile tint={tint}>{icon}</EmptyStateTile>}

      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: tint === 'slate' ? INK_SOFT : DEEP_AMBER,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>

      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: INK_SOFT,
          lineHeight: 1.55,
          margin: '0 auto',
          maxWidth: 320,
        }}
      >
        {body}
      </p>

      {accent && (
        <div style={{ marginTop: 14 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 6,
              background: AMBER_TINT_10,
              border: '1px solid rgba(247,147,30,0.28)',
              fontSize: 11,
              fontWeight: 700,
              color: DEEP_AMBER,
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
