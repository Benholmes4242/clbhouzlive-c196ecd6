/**
 * TeeTimesRail — horizontal card rail preview of upcoming tee groups,
 * matching the "On the course" featured-group carousel geometry but with
 * plain (non-amber) card treatment. Tapping any card — or the trailing
 * ghost "All tee times" tile — opens the full AllTeeTimesSheet.
 *
 * Empty state (no draw released) renders a single disabled card so the
 * section still communicates status.
 */
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { formatTimeHm } from '@/i18n/format';
import type { TeeGroup } from '../data/useTeeTimesAll';
import { SectionEyebrow } from './SectionEyebrow';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
} from '../../_shared/tokens';

const CARD_MIN_W = 218;

interface Props {
  groups: TeeGroup[];
  round: number;
  onOpenAll: () => void;
  tourCode?: string;
}

function tryParseTs(v: string | null | undefined): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

function formatTee(iso: string | null | undefined): string {
  const t = tryParseTs(iso);
  if (t == null) return iso ?? '';
  return formatTimeHm(new Date(t)).toUpperCase();
}

export function TeeTimesRail({ groups, round, onOpenAll, tourCode = 'pga' }: Props) {
  const { t } = useTranslation('tourhub');
  const kicker = t('tournament.teeTimesRail.eyebrow', {
    round,
    defaultValue: `Tee times · R${round}`,
  });
  const actionLabel = t('tournament.teeTimesRail.action', {
    defaultValue: 'All tee times',
  });

  // Defensive time-based filtering: keep groups with parseable timestamps
  // that are still in the future. Fall back to the raw list when nothing
  // remains (all started or times are display-only strings). Cap at 8.
  const now = Date.now();
  const upcoming = groups.filter((g) => {
    const ts = tryParseTs(g.teeTime);
    return ts != null && ts >= now;
  });
  const visible = (upcoming.length > 0 ? upcoming : groups).slice(0, 8);

  const isEmpty = groups.length === 0;

  return (
    <section id="tee-times-rail" style={{ fontFamily: FONT }}>
      <SectionEyebrow
        kicker={kicker}
        actionLabel={isEmpty ? undefined : actionLabel}
        onAction={isEmpty ? undefined : onOpenAll}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 10,
          overflowX: 'auto',
          padding: '0 16px 12px',
          scrollPaddingLeft: 16,
          scrollSnapType: 'x proximity',
          scrollbarWidth: 'none',
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {isEmpty ? (
          <div
            aria-disabled
            style={{
              minWidth: CARD_MIN_W,
              flexShrink: 0,
              background: SURFACE,
              border: `0.5px solid ${HAIRLINE_INK_8}`,
              borderRadius: 14,
              padding: '18px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 96,
              opacity: 0.65,
              fontSize: 12.5,
              fontWeight: 700,
              color: INK_MUTE,
              letterSpacing: '0.02em',
            }}
          >
            {t('tournament.teeTimesRail.notReleased', { defaultValue: 'Draw not yet released' })}
          </div>
        ) : (
          <>
            {visible.map((g, gi) => {
              const time = formatTee(g.teeTime);
              return (
                <button
                  type="button"
                  key={`${gi}-${g.teeTime}`}
                  onClick={onOpenAll}
                  className="active:bg-slate-50 transition-colors"
                  style={{
                    minWidth: CARD_MIN_W,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    background: SURFACE,
                    border: `0.5px solid ${HAIRLINE_INK_8}`,
                    borderRadius: 14,
                    padding: '12px 12px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: INK_FAINT,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {time ? `${time}` : ''}
                    {time && g.startingHole ? ' · ' : ''}
                    {g.startingHole ? `TEE ${g.startingHole}` : ''}
                  </div>
                  {g.players.slice(0, 3).map((p, pi) => (
                    <div
                      key={pi}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '6px 0',
                        minHeight: 40,
                        borderTop: pi === 0 ? 'none' : `0.5px solid ${HAIRLINE_INK_8}`,
                      }}
                    >
                      <PlayerAvatar
                        playerId={p.id ?? p.name}
                        playerName={p.name}
                        tourCode={tourCode}
                        photoUrl={p.photoUrl ?? null}
                        size="xs"
                        ringColor={LIGHT_HAIRLINE}
                      />
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: INK,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </div>
                    </div>
                  ))}
                </button>
              );
            })}

            {/* Trailing ghost card */}
            <button
              type="button"
              onClick={onOpenAll}
              aria-label={actionLabel}
              className="active:bg-slate-50 transition-colors"
              style={{
                minWidth: 132,
                flexShrink: 0,
                scrollSnapAlign: 'start',
                background: 'transparent',
                border: `1px dashed ${HAIRLINE_INK_8}`,
                borderRadius: 14,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              <ChevronRight size={20} strokeWidth={2} color={INK_MUTE} aria-hidden />
              <span style={{ fontSize: 11.5, fontWeight: 800, color: INK, textAlign: 'center' }}>
                {actionLabel}
              </span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default TeeTimesRail;
