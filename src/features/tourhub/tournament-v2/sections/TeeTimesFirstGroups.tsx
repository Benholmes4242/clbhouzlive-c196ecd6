/**
 * TeeTimesFirstGroups - tee-time group list, shared by the tournament page's
 * upcoming state (limit 5) and the All tee times sheet (no limit).
 *
 * Grid: '56px 1fr 62px'.
 *   col 1  time (15/800) with the TEE label stacked beneath it
 *   col 2  player name rows (flag + name)
 *   col 3  position + score, from the leaderboard entries when supplied
 *
 * No hairlines. Separation is the grid and whitespace. The component renders
 * on a transparent background and lets its parent set the surface.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTimeHm } from '@/i18n/format';
import type { TeeGroup } from '../data/useTeeTimesAll';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { countryFlag, countryFallback } from '../../leaderboard/countryFlag';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { FONT, INK, INK_MUTE, INK_FAINT } from '../../_shared/tokens';

const GROUP_GRID = '56px 1fr 62px';

interface Props {
  groups: TeeGroup[];
  /** Omit for no limit. */
  limit?: number;
  entries?: BoardEntry[];
  onPlayerTap?: (playerId: string, hasScore: boolean) => void;
}

export function TeeTimesFirstGroups({ groups, limit, entries, onPlayerTap }: Props) {
  const { t } = useTranslation('tourhub');
  const rows = limit == null ? groups : groups.slice(0, limit);

  const byPlayer = useMemo(() => {
    const m = new Map<string, BoardEntry>();
    (entries ?? []).forEach((e) => {
      const id = e.player?.id ?? null;
      if (id) m.set(id, e);
    });
    return m;
  }, [entries]);

  if (rows.length === 0) return null;

  return (
    <div style={{ fontFamily: FONT }}>
      {rows.map((g, i) => (
        <div
          key={`${g.teeTime}-${i}`}
          style={{
            display: 'grid',
            gridTemplateColumns: GROUP_GRID,
            padding: '13px 16px',
          }}
        >
          <div style={{ gridColumn: '1 / 2' }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTimeHm(new Date(g.teeTime))}
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: INK_FAINT,
              }}
            >
              {t('tournament.teeTimes.teeChip', { hole: g.startingHole })}
            </div>
          </div>

          <div style={{ gridColumn: '2 / 4', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {g.players.map((p, pi) => {
              const cc = p.country ?? null;
              const flag = cc ? countryFlag(cc) : null;
              const entry = p.id ? byPlayer.get(p.id) : undefined;
              const score = entry?.score ?? null;
              const hasScore = score != null;
              const posText =
                entry && entry.position != null
                  ? `${entry.position_tied ? 'T' : ''}${entry.position}`
                  : '';
              const tappable = Boolean(p.id && onPlayerTap);

              const inner = (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    {flag ? (
                      <span style={{ fontSize: 12, flexShrink: 0, lineHeight: 1 }} aria-label={cc ?? undefined}>
                        {flag}
                      </span>
                    ) : cc ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: INK_FAINT,
                          letterSpacing: '0.04em',
                          flexShrink: 0,
                        }}
                      >
                        {countryFallback(cc)}
                      </span>
                    ) : null}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: INK,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'flex-end',
                      gap: 6,
                    }}
                  >
                    {posText && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: INK_MUTE,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {posText}
                      </span>
                    )}
                    {hasScore && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: getScoreColor(score, 'light'),
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtScore(score)}
                      </span>
                    )}
                  </div>
                </>
              );

              const rowStyle: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: '1fr 62px',
                alignItems: 'center',
                gap: 6,
                padding: pi === 0 ? '0 0 5px' : '5px 0',
                minWidth: 0,
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                fontFamily: FONT,
              };

              return tappable ? (
                <button
                  key={`${p.id ?? p.name}-${pi}`}
                  type="button"
                  onClick={() => onPlayerTap!(p.id as string, hasScore)}
                  style={{ ...rowStyle, cursor: 'pointer' }}
                >
                  {inner}
                </button>
              ) : (
                <div key={`${p.id ?? p.name}-${pi}`} style={rowStyle}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
