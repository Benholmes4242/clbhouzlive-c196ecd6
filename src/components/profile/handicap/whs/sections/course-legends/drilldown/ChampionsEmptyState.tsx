import React from 'react';
import { EmptyState } from '@/features/courses/components/holes/analytical/tokens';

/**
 * Champions empty states (BRIEF_COURSE_DETAIL_EMPTY_STATES).
 *
 * No amber circle, no crown glyph, no icon tile. A crown is claimed by posting
 * a round, not by tapping here, so the true empty carries no button.
 */

/** No legends in ANY window - the true empty. */
export const ChampionsEmptyState: React.FC<{ courseName: string | null }> = ({ courseName }) => (
  <div style={{ padding: '20px 16px' }}>
    <EmptyState
      kicker="Champions"
      title="Claim the first crown"
      body={`No one's posted a round at ${courseName ?? 'this course'} yet. Post your first and you'll top every leaderboard - gross, birdies, stableford - until someone beats you.`}
    />
  </div>
);

/** Active window empty, but the other window has data. */
export const ChampionsWindowEmptyState: React.FC<{
  window: '90d' | 'all_time';
  onSwitch: () => void;
}> = ({ window, onSwitch }) => (
  <div style={{ padding: '20px 16px' }}>
    <EmptyState
      kicker="Champions"
      title={window === '90d' ? 'No crowns in the last 90 days' : 'No all-time crowns yet'}
      body={
        window === '90d'
          ? 'No rounds posted here recently - but the all-time leaderboards are stacked.'
          : 'Nothing in this window yet.'
      }
      action={{
        label: window === '90d' ? 'View all-time' : 'View last 90 days',
        onClick: onSwitch,
      }}
    />
  </div>
);
