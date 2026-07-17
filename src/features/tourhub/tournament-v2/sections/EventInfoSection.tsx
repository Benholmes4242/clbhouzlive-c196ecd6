/**
 * EventInfoSection — always-on info block. Renders for every state
 * (never self-hides) since Dates + Venue always exist. Individual
 * rows omit only when their field is null. Overview grammar: eyebrow
 * + hairline rows on canvas.
 *
 * Live events with tee-time coverage gain a tappable row that opens
 * the full tee-times sheet (Brief F-TD-4).
 */
import { useTranslation } from 'react-i18next';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import { formatPurse } from '../../_shared/formatPurse';
import { SectionEyebrow } from './SectionEyebrow';
import { FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE } from '../../_shared/tokens';
import { formatNumber, formatTournamentDateRange } from '@/i18n/format';


interface Props {
  meta: TournamentMeta;
  broadcast?: string | null;
  onTeeTimesTap?: (() => void) | null;
  teeTimesRound?: number | null;
}

function fmtRange(start: string | null, end: string | null): string | null {
  return formatTournamentDateRange(start, end);
}


export function EventInfoSection({ meta, broadcast, onTeeTimesTap, teeTimesRound }: Props) {
  const { t } = useTranslation('tourhub');
  const rows: Array<[string, string]> = [];

  const dates = fmtRange(meta.start_date, meta.end_date);
  if (dates) rows.push([t('tournament.eventInfo.dates'), dates]);

  const venue = [
    meta.venue_name,
    [meta.venue_city, meta.venue_country].filter(Boolean).join(', ') || null,
  ].filter(Boolean).join(' · ');
  if (venue) rows.push([t('tournament.eventInfo.venue'), venue]);

  const py = [
    meta.venue_par != null ? t('board.meta.par', { par: meta.venue_par }) : null,
    meta.venue_yardage != null
      ? t('tournament.eventInfo.yardageShort', { yardage: formatNumber(meta.venue_yardage) })
      : null,
  ].filter(Boolean).join(' · ');
  if (py) rows.push([t('tournament.eventInfo.parYardageLabel'), py]);

  if (meta.purse != null) rows.push([t('tournament.hero.purseLabel'), formatPurse(meta.purse)]);
  if (meta.defending_champion) rows.push([t('tournament.hero.defendingLabel'), meta.defending_champion]);
  if (broadcast) rows.push([t('tournament.eventInfo.tv'), broadcast]);

  const showTeeTimes = !!onTeeTimesTap && teeTimesRound != null;


  return (
    <section style={{ fontFamily: FONT }}>
      <SectionEyebrow kicker={t('tournament.eventInfo.eyebrow')} />
      <div style={{ background: SURFACE }}>
        {rows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              padding: '12px 16px',
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

        {showTeeTimes && (
          <button
            type="button"
            onClick={onTeeTimesTap}
            className="active:bg-slate-100 transition-colors"
            style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              width: '100%',
              padding: '12px 16px',
              borderTop: rows.length === 0 ? `0.5px solid ${HAIRLINE_INK_8}` : 'none',
              borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
              background: 'transparent',
              borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 104, flexShrink: 0,
                fontSize: 9, fontWeight: 800, color: INK_FAINT,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}
            >
              {t('tournament.eventInfo.teeTimes')}
            </div>
            <div
              style={{
                flex: 1, minWidth: 0,
                fontSize: 13, fontWeight: 700, color: INK,
                lineHeight: 1.4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Round {teeTimesRound} <span style={{ color: INK }}>›</span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}

