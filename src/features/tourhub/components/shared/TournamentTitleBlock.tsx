import React from 'react';
import { MapPin } from 'lucide-react';
import {
  amber, slate200, slate400, slate500, ink, greenLive,
} from '../../utils/heroAtmosphere';

/**
 * <TournamentTitleBlock> — eyebrow row + status row + tournament title +
 * venue line. Lives inside an ElasticZone and scales proportionally with `t`.
 *
 * Title:  32 + t*24 px (32→56), letter-spacing -0.04em, line-height 0.86→0.90
 * Venue:  10 + t*3  px (10→13)
 * Gaps:   eyebrow→status = 6 + t*8, section gaps = 4 + t*8
 */
export interface TournamentTitleBlockProps {
  t: number;
  /** Left text in the eyebrow row, e.g. "LIVE THIS HOUR". */
  eyebrowLabel: string;
  /** Right text in the eyebrow row, e.g. "R2/4" or "May 30". */
  eyebrowRight?: string;
  /** Status row content (TourBadge + status pill, etc.). */
  statusRow?: React.ReactNode;
  /** Tournament name. Will wrap onto two lines naturally. */
  title: string;
  venueName?: string | null;
  venueCity?: string | null;
  /** Eyebrow rule colour. Defaults to amber. */
  ruleColor?: string;
}

export function TournamentTitleBlock({
  t,
  eyebrowLabel,
  eyebrowRight,
  statusRow,
  title,
  venueName,
  venueCity,
  ruleColor = amber,
}: TournamentTitleBlockProps) {
  const titleSize = 32 + t * 24;
  const titleLh = 0.86 + t * 0.04;
  const venueSize = 10 + t * 3;
  const headerGapTop = 6 + t * 8;
  const headerGapBetween = 4 + t * 8;

  const venue = [venueName, venueCity].filter(Boolean).join(' · ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: headerGapTop }}>
        <span
          aria-hidden="true"
          style={{ width: 18, height: 1.5, background: ruleColor, flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em',
            color: ruleColor, textTransform: 'uppercase',
          }}
        >
          {eyebrowLabel}
        </span>
        <span style={{ flex: 1, height: 1, background: slate200 }} />
        {eyebrowRight && (
          <span
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              color: slate500, fontVariantNumeric: 'tabular-nums',
              textTransform: 'uppercase',
            }}
          >
            {eyebrowRight}
          </span>
        )}
      </div>

      {/* Status row */}
      {statusRow && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: headerGapBetween,
          }}
        >
          {statusRow}
        </div>
      )}

      {/* Title */}
      <h1
        style={{
          margin: 0,
          fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: titleSize,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: titleLh,
          color: ink,
          textWrap: 'balance' as any,
        }}
      >
        {title}
      </h1>

      {/* Venue */}
      {venue && (
        <div
          style={{
            marginTop: headerGapBetween,
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: venueSize, color: slate500, fontWeight: 600,
          }}
        >
          <MapPin size={Math.round(venueSize)} strokeWidth={2.2} style={{ opacity: 0.85 }} />
          <span>{venue}</span>
        </div>
      )}
    </div>
  );
}

/**
 * <TourBadge> — small ink-bg/white-text tour code chip.
 */
export function TourBadge({ code }: { code: string }) {
  return (
    <span
      style={{
        padding: '3px 6px',
        borderRadius: 4,
        background: ink,
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.10em',
      }}
    >
      {code}
    </span>
  );
}

/**
 * <StatusBadge> — coloured status pill (e.g. LIVE, FINAL, UPCOMING).
 */
export function StatusBadge({
  label,
  color,
  bg,
  pulse,
}: {
  label: string;
  color: string;
  bg: string;
  pulse?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 7px', borderRadius: 4,
        background: bg, color,
        fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em',
      }}
    >
      {pulse && (
        <span
          aria-hidden="true"
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: greenLive,
            animation: 'heroPulse 1.6s infinite',
          }}
        />
      )}
      {label}
    </span>
  );
}

// re-exports so consumers don't have to import from two places
export { slate400, slate500 };
