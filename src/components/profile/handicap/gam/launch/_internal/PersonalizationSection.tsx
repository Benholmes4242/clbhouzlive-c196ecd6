import React from 'react';
import { Check } from 'lucide-react';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const AMBER = '#F7931E';

interface PersonalizationSectionProps {
  achievementsEarned: number;
  activeStreaks: number;
  sharedRounds: number;
}

interface StatLineProps {
  count: number;
  singular: string;
  plural: string;
}

const StatLine: React.FC<StatLineProps> = ({ count, singular, plural }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <Check size={15} color={AMBER} strokeWidth={2.5} />
    <span
      style={{
        fontFamily: FONT,
        fontSize: 14,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.72)',
      }}
    >
      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{count}</span>{' '}
      {count === 1 ? singular : plural}
    </span>
  </div>
);

export const PersonalizationSection: React.FC<PersonalizationSectionProps> = ({
  achievementsEarned,
  activeStreaks,
  sharedRounds,
}) => {
  const lines: React.ReactNode[] = [];
  if (achievementsEarned > 0) {
    lines.push(
      <StatLine
        key="ach"
        count={achievementsEarned}
        singular="achievement you've earned"
        plural="achievements you've earned"
      />,
    );
  }
  if (activeStreaks > 0) {
    lines.push(
      <StatLine
        key="str"
        count={activeStreaks}
        singular="active streak"
        plural="active streaks"
      />,
    );
  }
  if (sharedRounds > 0) {
    lines.push(
      <StatLine
        key="sha"
        count={sharedRounds}
        singular="head-to-head round"
        plural="head-to-head rounds"
      />,
    );
  }
  if (lines.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.55)',
          margin: 0,
        }}
      >
        Some of these are already tracking your history. We've found:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{lines}</div>
    </div>
  );
};

export default PersonalizationSection;
