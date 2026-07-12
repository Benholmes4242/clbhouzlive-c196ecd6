/**
 * EventInfoSection — always-on info block. Renders for every state
 * (never self-hides) since Dates + Venue always exist. Individual
 * rows omit only when their field is null. Overview grammar: eyebrow
 * + hairline rows on canvas.
 */
import { format, isSameMonth } from 'date-fns';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import { formatPurse } from '../../components/shared/TourHeroHelpers';
import { SectionEyebrow } from './SectionEyebrow';
import { FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE } from '../../_shared/tokens';

interface Props {
  meta: TournamentMeta;
  broadcast?: string | null;
}

function fmtRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const s = new Date(start);
  if (!end) return format(s, 'MMM d, yyyy');
  const e = new Date(end);
  if (isSameMonth(s, e)) return `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`;
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
}

export function EventInfoSection({ meta, broadcast }: Props) {
  const rows: Array<[string, string]> = [];

  const dates = fmtRange(meta.start_date, meta.end_date);
  if (dates) rows.push(['Dates', dates]);

  const venue = [
    meta.venue_name,
    [meta.venue_city, meta.venue_country].filter(Boolean).join(', ') || null,
  ].filter(Boolean).join(' · ');
  if (venue) rows.push(['Venue', venue]);

  const py = [
    meta.venue_par != null ? `Par ${meta.venue_par}` : null,
    meta.venue_yardage != null ? `${meta.venue_yardage.toLocaleString()} yds` : null,
  ].filter(Boolean).join(' · ');
  if (py) rows.push(['Par / Yardage', py]);

  if (meta.purse != null) rows.push(['Purse', formatPurse(meta.purse)]);
  if (meta.defending_champion) rows.push(['Defending', meta.defending_champion]);
  if (broadcast) rows.push(['TV', broadcast]);

  return (
    <section style={{ fontFamily: FONT }}>
      <SectionEyebrow kicker="Event Info" />
      <div style={{ background: SURFACE }}>
        {rows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              padding: '11px 16px',
              borderTop: i === 0 ? `0.5px solid ${HAIRLINE_INK_8}` : 'none',
              borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
            }}
          >
            <div
              style={{
                width: 104, flexShrink: 0,
                fontSize: 9, fontWeight: 800, color: INK_FAINT,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}
            >
              {label}
            </div>
            <div
              style={{
                flex: 1, minWidth: 0,
                fontSize: 13, fontWeight: 700, color: INK,
                lineHeight: 1.4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
