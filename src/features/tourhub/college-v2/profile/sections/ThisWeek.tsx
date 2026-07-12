/**
 * ThisWeek — leads with alumni playing / just-played this week.
 *
 * Self-hides entirely when there are zero week rows (roster naturally leads).
 * Row tap navigates to the tournament page (route contract preserved).
 */

import { Link } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { tournamentRoute } from '@/features/tourhub/routes';
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  STATUS_LIVE,
  SURFACE,
  TREND_UP,
} from '@/features/tourhub/_shared/tokens';
import { useThisWeekAlumni, type WeekAlumnusRow } from '../data/useThisWeekAlumni';

interface Props {
  slug: string;
  collegeName: string;
}

function formatPos(row: WeekAlumnusRow): string {
  if (row.position == null) return '\u2014';
  return `${row.positionTied ? 'T' : ''}${row.position}`;
}

function subline(row: WeekAlumnusRow): string {
  const pos = formatPos(row);
  if (row.isLive) {
    return `${row.tournamentName} \u00B7 ${pos} \u00B7 thru ${row.thru ?? 0}`;
  }
  return `${row.tournamentName} \u00B7 ${pos}`;
}

export function ThisWeek({ slug, collegeName }: Props) {
  const { data } = useThisWeekAlumni(slug);
  const rows = data ?? [];
  if (rows.length === 0) return null;

  return (
    <section style={{ background: SURFACE, fontFamily: FONT }}>
      <header style={{ padding: '16px 16px 8px' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: AMBER,
          }}
        >
          This Week
        </div>
      </header>
      {rows.map((row) => (
        <Link
          key={`${row.playerId}-${row.tournamentId}`}
          {...tournamentRoute(row.tournamentId, { kind: 'college', collegeName })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderTop: `0.5px solid ${HAIRLINE_INK_10}`,
            textDecoration: 'none',
            color: 'inherit',
          }}
          className="active:bg-black/[0.02]"
        >
          <SquircleAvatar
            size={30}
            srcCandidates={getPlayerHeadshotCandidates(row.fullName, row.tourCodes?.[0] ?? 'pga')}
            alt={row.fullName}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.005em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.fullName}
            </div>
            <div
              style={{
                marginTop: 1,
                fontSize: 10,
                fontWeight: 600,
                color: row.isLive ? STATUS_LIVE : INK_MUTE,
                letterSpacing: '0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {subline(row)}
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: (row.money ?? 0) > 0 ? TREND_UP : INK_FAINT,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
              flexShrink: 0,
            }}
          >
            {row.money && row.money > 0 ? formatCurrency(row.money) : '\u2014'}
          </div>
        </Link>
      ))}
    </section>
  );
}
