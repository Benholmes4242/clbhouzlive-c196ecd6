/**
 * TeeTimesFirstGroups — TD1 first N groups list.
 *
 * Layout: time (15/200 thin) + tee-N chip, then a stacked column of
 * players — flag first, then full name, one row per player.
 *
 * `surface`:
 *   - 'white' (default) — opaque SURFACE background, preserves the
 *     tournament-page band.
 *   - 'transparent' — lets the parent sheet's SLATE_50 show through
 *     (used by AllTeeTimesSheet).
 */
import { useTranslation } from 'react-i18next';
import { formatTimeHm } from '@/i18n/format';
import type { TeeGroup } from '../data/useTeeTimesAll';
import { countryFlag, countryFallback } from '../../leaderboard/countryFlag';
import { FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE } from '../../_shared/tokens';

interface Props {
  groups: TeeGroup[];
  limit?: number;
  surface?: 'white' | 'transparent';
}

export function TeeTimesFirstGroups({ groups, limit = 5, surface = 'white' }: Props) {
  const { t } = useTranslation('tourhub');
  const rows = groups.slice(0, limit);
  if (rows.length === 0) return null;
  const bg = surface === 'transparent' ? 'transparent' : SURFACE;
  return (
    <div style={{ background: bg, fontFamily: FONT }}>
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
            <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {t('tournament.teeTimes.teeChip', { hole: g.startingHole })}
            </span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column' }}>
            {g.players.map((p, pi) => {
              const cc = p.country ?? null;
              const flag = cc ? countryFlag(cc) : null;
              return (
                <div
                  key={`${p.id ?? p.name}-${pi}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '2px 0',
                    minWidth: 0,
                  }}
                >
                  {flag ? (
                    <span style={{ fontSize: 12, flexShrink: 0, lineHeight: 1 }} aria-label={cc ?? undefined}>{flag}</span>
                  ) : cc ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: INK_FAINT, letterSpacing: '0.04em', flexShrink: 0 }}>
                      {countryFallback(cc)}
                    </span>
                  ) : null}
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
