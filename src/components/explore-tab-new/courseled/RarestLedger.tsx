import { useTranslation } from 'react-i18next';

import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, CARD_SHELL, Eyebrow, NUMF, SANS } from './tokens';

/**
 * Section 6 — RAREST OF ALL, course-first (BRIEF, section 6).
 *
 * Unchanged in substance from the wire era — every ace and albatross on the
 * platform, never windowed, dated by YEAR because "3 years ago" on a hole in
 * one reads as staleness while "2022" reads as history. The one change is the
 * reading order: the COURSE leads the row and the feat plus actor drop to the
 * sub-line, matching every other course-led section.
 */

const DOT = '\u00B7';

interface Props {
  events: WireEvent[];
  onRowPress?: (event: WireEvent) => void;
}

export function RarestLedger({ events, onRowPress }: Props) {
  const { t } = useTranslation('courses');
  if (events.length === 0) return null;

  return (
    <section>
      <Eyebrow>{t('discover.rarestTitle', 'Rarest of all')}</Eyebrow>

      <div style={{ ...CARD_SHELL, padding: '4px 14px', fontFamily: SANS }}>
        {events.map((e, i) => {
          const isAce = e.kind === 'ace';
          const par = e.holePar ?? (isAce ? 3 : 5);
          const strokes = isAce ? 1 : Math.max(1, par - 3);
          const feat = isAce
            ? e.holeNo != null
              ? t('discover.rarest.aceAt', {
                  defaultValue: 'Hole in one, {{hole}}',
                  hole: formatOrdinal(e.holeNo),
                })
              : t('discover.wire.tag.ace', 'Hole in one')
            : e.holeNo != null
              ? t('discover.rarest.albatrossAt', {
                  defaultValue: 'Albatross, {{hole}}',
                  hole: formatOrdinal(e.holeNo),
                })
              : t('discover.wire.tag.albatross', 'Albatross');
          const who = e.isOwn ? t('discover.wire.you', 'You') : e.actorName;

          return (
            <button
              key={e.id}
              type="button"
              onClick={onRowPress ? () => onRowPress(e) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                width: '100%',
                padding: '11px 0',
                border: 'none',
                background: 'transparent',
                borderBottom: i === events.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: onRowPress ? 'pointer' : 'default',
              }}
            >
              <ScoreMark strokes={strokes} par={par} size={34} />

              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: A.INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.courseName ?? t('discover.unknownCourse', 'Course')}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    color: e.isOwn ? A.AMBER_DEEP : A.MUTE,
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {feat} {DOT} {who}
                </span>
              </span>

              <span style={{ ...NUMF, fontSize: 12, color: A.DIM, flexShrink: 0 }}>
                {formatYearNumeric(e.at)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default RarestLedger;
