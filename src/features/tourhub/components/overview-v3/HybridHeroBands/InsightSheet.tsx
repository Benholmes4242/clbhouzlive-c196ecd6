/**
 * InsightSheet — Venue detail sheet for the PhotoBand insight line.
 *
 * Always renders (for any venue):
 *   1. Header — course name + location line
 *   2. Three stat tiles — Par | Yards | Purse (em dash for missing values)
 *   3. The insight prose (under a hairline divider)
 *
 * Conditionally renders "Course character" block ONLY when the venue has a
 * course_dna_profiles row — omitted entirely (heading and all) when absent.
 *
 * The DNA row is fetched lazily via `useVenueCourseDna`, gated on `open` — the
 * hero never triggers the query on mount.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatNumber } from '@/i18n/format';
import { formatPurse } from '../../../_shared/formatPurse';
import { useVenueCourseDna } from '../../../hooks/useVenueCourseDna';
import { AMBER } from '../HybridHero.constants';

interface Props {
  open: boolean;
  onClose: () => void;
  insight: string;
  venueName?: string | null;
  venueCourseName?: string | null;
  venueCity?: string | null;
  venueState?: string | null;
  venueCountry?: string | null;
  venuePar?: number | null;
  venueYardage?: number | null;
  purse?: number | null;
}

const INK = '#0F172A';
const DIM = '#64748B';
const HAIR = 'rgba(15,23,42,0.10)';
const TILE_BG = '#FFFFFF';

const STAT_KEYS: Array<{
  key: keyof import('../../../hooks/useVenueCourseDna').VenueCourseDna;
  label: string;
}> = [
  { key: 'driving_distance_importance', label: 'Driving distance' },
  { key: 'driving_accuracy_importance', label: 'Driving accuracy' },
  { key: 'gir_importance', label: 'Greens in regulation' },
  { key: 'scrambling_importance', label: 'Scrambling' },
  { key: 'putting_importance', label: 'Putting' },
  { key: 'sg_off_tee_importance', label: 'SG: Off the tee' },
  { key: 'sg_approach_importance', label: 'SG: Approach' },
  { key: 'sg_around_green_importance', label: 'SG: Around the green' },
  { key: 'sg_putting_importance', label: 'SG: Putting' },
];

function formatCourseType(raw: string | null): string | null {
  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
}

function StatTile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: TILE_BG,
        border: `1px solid ${HAIR}`,
        borderRadius: 14,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function InsightSheet({
  open,
  onClose,
  insight,
  venueName = null,
  venueCourseName = null,
  venueCity = null,
  venueState = null,
  venueCountry = null,
  venuePar = null,
  venueYardage = null,
  purse = null,
}: Props) {
  const { t } = useTranslation('tourhub');

  // Lazy DNA fetch — only fires when the sheet is open.
  const dnaQuery = useVenueCourseDna(venueName, open);
  const dna = dnaQuery.data ?? null;

  const courseTitle = venueCourseName ?? venueName ?? '';
  const locationLine = useMemo(() => {
    // Matches the composition used in useTourEvents (city, state, country).
    return [venueCity, venueState, venueCountry].filter(Boolean).join(', ');
  }, [venueCity, venueState, venueCountry]);

  const parValue = venuePar != null ? formatNumber(venuePar) : '—';
  const yardsValue = venueYardage != null ? formatNumber(venueYardage) : '—';
  const purseValue = purse != null ? (formatPurse(purse) || '—') : '—';

  const topImportance = useMemo(() => {
    if (!dna) return [] as Array<{ label: string; value: number }>;
    const scored = STAT_KEYS.map(({ key, label }) => {
      const v = dna[key];
      return typeof v === 'number' ? { label, value: v } : null;
    }).filter((x): x is { label: string; value: number } => !!x);
    scored.sort((a, b) => b.value - a.value);
    return scored.slice(0, 2);
  }, [dna]);

  const showCharacterBlock =
    !!dna && (!!formatCourseType(dna.course_type) || topImportance.length > 0 || dna.avg_winning_score != null);
  const courseTypeLabel = formatCourseType(dna?.course_type ?? null);

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="insight-sheet-title">
      <div
        style={{
          padding: '4px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '75dvh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        {(courseTitle || locationLine) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {courseTitle && (
              <div
                id="insight-sheet-title"
                style={{ fontSize: 20, fontWeight: 700, color: INK, lineHeight: 1.2 }}
              >
                {courseTitle}
              </div>
            )}
            {locationLine && (
              <div style={{ fontSize: 13, color: DIM, fontWeight: 500 }}>{locationLine}</div>
            )}
          </div>
        )}

        {/* Stat tiles — always three, em dash for null */}
        <div style={{ display: 'flex', gap: 8 }}>
          <StatTile value={parValue} label={t('overview.courseStats.parLabel')} />
          <StatTile value={yardsValue} label={t('overview.cinematic.colYards')} />
          <StatTile value={purseValue} label={t('overview.cinematic.colPurse')} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: HAIR, width: '100%' }} />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          {t('overview.photoBand.insightTitle')}
        </div>

        {/* Insight prose */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: INK,
            whiteSpace: 'pre-wrap',
          }}
        >
          {insight}
        </div>

        {/* Course character — DNA-gated */}
        {showCharacterBlock && (
          <>
            <div style={{ height: 1, background: HAIR, width: '100%' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: DIM,
                }}
              >
                {t('overview.photoBand.courseCharacter')}
              </div>

              {courseTypeLabel && (
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: 'rgba(247,147,30,0.12)',
                      color: '#A15E00',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {courseTypeLabel}
                  </span>
                </div>
              )}

              {topImportance.map(({ label, value }) => {
                const pct = Math.max(0, Math.min(100, Math.round(value)));
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        fontSize: 13,
                        color: INK,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{label}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: DIM,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {pct}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(15,23,42,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: AMBER,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {dna?.avg_winning_score != null && (
                <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>
                  {t('overview.photoBand.avgWinningScore', {
                    score: formatNumber(dna.avg_winning_score),
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            minHeight: 50,
            borderRadius: 14,
            background: INK,
            color: '#fff',
            fontSize: 15.5,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          {'Close'}
        </button>
      </div>
    </BottomSheet>
  );
}

export default InsightSheet;
