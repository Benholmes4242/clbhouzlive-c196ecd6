/**
 * TeeTimesFirstGroups — TD1 first N groups list for upcoming state.
 * Time 15/200 thin + names line beneath.
 */
import { useTranslation } from 'react-i18next';
import { formatTimeHm } from '@/i18n/format';
import type { TeeGroup } from '../data/useTeeTimesAll';
import { FONT, INK, INK_MUTE, HAIRLINE_INK_8, SURFACE } from '../../_shared/tokens';

interface Props { groups: TeeGroup[]; limit?: number }

export function TeeTimesFirstGroups({ groups, limit = 5 }: Props) {
  const { t } = useTranslation('tourhub');
  const rows = groups.slice(0, limit);
  if (rows.length === 0) return null;
  return (
    <div style={{ background: SURFACE, fontFamily: FONT }}>
      {rows.map((g, i) => (
        <div
          key={`${g.teeTime}-${i}`}
          style={{
            padding: '10px 16px',
            borderTop: i === 0 ? `0.5px solid ${HAIRLINE_INK_8}` : 'none',
            borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 200, color: INK, fontVariantNumeric: 'tabular-nums' }}>
              {formatTimeHm(new Date(g.teeTime))}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {t('tournament.teeTimes.teeChip', { hole: g.startingHole })}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK_MUTE, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {g.players.map((p) => p.name).join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}

