/**
 * STREAKS -- current and best, side by side. No tier ladder: a streak is a
 * live number and a personal record, and the ladder was the loot reading of it.
 */
import React from 'react';
import { REC } from '../tokens';
import { Panel, Figure, MetaLabel } from '../Primitives';
import { monthYear } from '../format';
import type { StreakRow } from '@/lib/gam/types';

const LABEL: Record<string, { label: string; unit: string }> = {
  round_streak: { label: 'Weeks with a round', unit: 'wks' },
  sub_80_streak: { label: 'Rounds under 80', unit: '' },
  cutting_streak: { label: 'Index cuts in a row', unit: '' },
  birdie_round_streak: { label: 'Rounds with a birdie', unit: '' },
};

interface Props {
  streaks: StreakRow[];
}

export const StreaksPanel: React.FC<Props> = ({ streaks }) => {
  const rows = streaks.filter((s) => LABEL[s.streak_type]);
  if (rows.length === 0) return null;
  return (
    <Panel title="STREAKS">
      {rows.map((s, i) => {
        const meta = LABEL[s.streak_type];
        const unit = meta.unit ? ` ${meta.unit}` : '';
        return (
          <div
            key={s.streak_type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${REC.BORDER}`,
              fontFamily: REC.FONT,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: REC.INK }}>{meta.label}</div>
              <div style={{ marginTop: 3, fontSize: 11, color: REC.MUTE, ...REC.TABULAR }}>
                {s.is_active && s.current_started_at
                  ? `Running since ${monthYear(s.current_started_at)}`
                  : 'Not running'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <MetaLabel>NOW</MetaLabel>
              <div>
                <Figure
                  value={`${s.current_count}${unit}`}
                  size={17}
                  color={s.current_count > 0 ? REC.AMBER : REC.DIM}
                />
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 56 }}>
              <MetaLabel>BEST</MetaLabel>
              <div>
                <Figure value={`${s.best_count}${unit}`} size={17} color={REC.INK} />
              </div>
            </div>
          </div>
        );
      })}
    </Panel>
  );
};

export default StreaksPanel;
