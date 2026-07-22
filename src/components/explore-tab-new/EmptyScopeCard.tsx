import { FONT } from './gamingLightTokens';

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';

interface Props {
  title: string;
  subline?: string;
}

/**
 * Muted "unconquered" empty state used across Discover community sections
 * when the region toggle filters them to zero. Deliberately quiet — single
 * line + optional sub-line, no illustrations.
 */
export function EmptyScopeCard({ title, subline }: Props) {
  return (
    <div
      style={{
        margin: '10px 16px 0',
        padding: '14px 14px',
        background: CARD_BG,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      {subline ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 500,
            color: MUTE,
            lineHeight: 1.35,
          }}
        >
          {subline}
        </div>
      ) : null}
    </div>
  );
}

export default EmptyScopeCard;
