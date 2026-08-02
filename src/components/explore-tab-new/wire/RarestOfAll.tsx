import { useTranslation } from 'react-i18next';

import {
  A,
  FIGS,
  LABEL,
  Panel,
  SANS,
} from '@/features/courses/components/holes/analytical/tokens';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { formatNumber, formatOrdinal, formatYearNumeric } from '@/i18n/format';
import type { WireEvent } from '../hooks/useDiscoverWire';

/**
 * RarestOfAll — every hole in one and albatross on the platform
 * (BRIEF_DISCOVER_REBUILD §2).
 *
 * These left the chronological wire deliberately: five events, none inside the
 * horizon, the oldest from 2022. In a feed they sat at the very bottom under a
 * birdie haul from last week. The panel is never gated on recency — that is the
 * whole point — and the date renders as a YEAR, because "3 years ago" on a hole
 * in one reads as staleness while "2022" reads as history.
 *
 * The mark is the same gold ring the scorecard uses (CORRECTION_ONE_SCORING_MARK):
 * a hole in one must look the same wherever it appears.
 */

interface Props {
  events: WireEvent[];
  onRowPress?: (event: WireEvent) => void;
}

export function RarestOfAll({ events, onRowPress }: Props) {
  const { t } = useTranslation('courses');

  if (events.length === 0) return null;

  return (
    <Panel
      title={t('discover.rarestTitle', 'Rarest of all')}
      aside={t('discover.nAllTime', {
        defaultValue: '{{value}} all time',
        count: events.length,
        value: formatNumber(events.length),
      })}
      style={{ fontFamily: SANS, ...FIGS }}
    >
      <p style={{ margin: '-6px 0 6px', fontSize: 13, lineHeight: 1.45, color: A.MUTE }}>
        {t(
          'discover.rarestIntro',
          'Every hole in one and albatross logged on clbhouz, from official WHS rounds.',
        )}
      </p>

      {events.map((e) => {
        const isAce = e.kind === 'ace';
        const par = e.holePar ?? (isAce ? 3 : 5);
        const strokes = isAce ? 1 : Math.max(1, par - 3);
        const holeText = e.holeNo != null ? formatOrdinal(e.holeNo) : '';
        const meta = holeText
          ? e.holeYards != null
            ? t('discover.rarestHoleYards', {
                defaultValue: '{{hole}}, par {{par}}, {{yards}} yds',
                hole: holeText,
                par: formatNumber(par),
                yards: formatNumber(e.holeYards),
              })
            : t('discover.rarestHole', {
                defaultValue: '{{hole}}, par {{par}}',
                hole: holeText,
                par: formatNumber(par),
              })
          : '';
        const where = [meta, e.courseName].filter(Boolean).join(' \u00B7 ');

        return (
          <button
            key={e.id}
            type="button"
            onClick={onRowPress ? () => onRowPress(e) : undefined}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              cursor: onRowPress ? 'pointer' : 'default',
              display: 'grid',
              gridTemplateColumns: '34px 1fr auto',
              alignItems: 'center',
              gap: 12,
              padding: '13px 0',
              fontFamily: SANS,
              textAlign: 'left',
              ...FIGS,
            }}
          >
            <ScoreMark strokes={strokes} par={par} size={34} />

            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 700,
                  color: e.isOwn ? A.AMBER_DEEP : A.INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.isOwn ? t('discover.wire.you', 'You') : e.actorName}
              </span>
              {where && (
                <span
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    color: A.MUTE,
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {where}
                </span>
              )}
            </span>

            <span style={{ textAlign: 'right', flex: 'none' }}>
              <span
                style={{
                  ...LABEL,
                  fontSize: 8.5,
                  color: A.INK,
                  display: 'block',
                }}
              >
                {isAce
                  ? t('discover.wire.tag.ace', 'Hole in one')
                  : t('discover.wire.tag.albatross', 'Albatross')}
              </span>
              <span style={{ ...LABEL, display: 'block', marginTop: 3 }}>
                {formatYearNumeric(e.at)}
              </span>
            </span>
          </button>
        );
      })}
    </Panel>
  );
}

export default RarestOfAll;
