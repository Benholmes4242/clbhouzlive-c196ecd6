/**
 * TeeTimesRail — horizontal preview rail of upcoming tee groups on the
 * tournament page. Mirrors the "On the course" featured-group carousel
 * anatomy, minus the amber ring/FEATURED chip (plain SURFACE + hairline).
 * The full round sheet remains the complete view; the rail is a preview +
 * entry point (every tap opens the sheet).
 */
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SectionEyebrow } from './SectionEyebrow';
import type { TeeGroup } from '../data/useTeeTimesAll';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  FONT, INK, INK_MUTE, INK_FAINT, SURFACE, HAIRLINE_INK_8,
} from '../../_shared/tokens';
import { formatTimeHm } from '@/i18n/format';

interface Props {
  groups: TeeGroup[];
  round: number;
  onOpenAll: () => void;
}

const CARD_MIN_W = 218;
const MAX_CARDS = 8;

function formatTeeTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).toUpperCase();
  return formatTimeHm(d).toUpperCase();
}

/**
 * Show groups scheduled at/after "now" for the current round; if none are
 * upcoming (all started or times aren't real timestamps) fall back to the
 * first groups. Cap at MAX_CARDS.
 */
function pickGroups(all: TeeGroup[]): TeeGroup[] {
  if (all.length === 0) return [];
  const now = Date.now();
  const upcoming = all.filter((g) => {
    const t = Date.parse(g.teeTime);
    return Number.isFinite(t) && t >= now;
  });
  const chosen = upcoming.length > 0 ? upcoming : all;
  return chosen.slice(0, MAX_CARDS);
}

export function TeeTimesRail({ groups, round, onOpenAll }: Props) {
  const { t } = useTranslation('tourhub');
  const kicker = t('tournament.teeTimesRail.eyebrow', {
    round,
    defaultValue: `Tee times · R${round}`,
  });
  const actionLabel = t('tournament.teeTimesRail.action', {
    defaultValue: 'All tee times',
  });

  const empty = groups.length === 0;
  const visible = pickGroups(groups);

  return (
    <section id="tee-times-rail" style={{ fontFamily: FONT }}>
      <SectionEyebrow
        kicker={kicker}
        actionLabel={empty ? undefined : actionLabel}
        onAction={empty ? undefined : onOpenAll}
      />

      {empty ? (
        <div style={{ padding: '0 16px 8px' }}>
          <div
            aria-disabled
            style={{
              width: '100%',
              padding: '13px 14px',
              background: SURFACE,
              border: `0.5px solid ${HAIRLINE_INK_8}`,
              borderRadius: 14,
              color: INK_MUTE,
              fontSize: 12.5,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {t('tournament.teeTimesRail.notReleased', {
              defaultValue: 'Draw not yet released',
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 10,
            overflowX: 'auto',
            padding: '0 16px 6px',
            scrollPaddingLeft: 16,
            scrollSnapType: 'x proximity',
            scrollbarWidth: 'none',
          }}
          className="[&::-webkit-scrollbar]:hidden"
        >
          {visible.map((g, gi) => {
            const time = formatTeeTime(g.teeTime);
            const meta = t('tournament.teeTimesRail.metaLine', {
              time,
              tee: g.startingHole,
              defaultValue: `${time} · TEE ${g.startingHole}`,
            });
            return (
              <button
                key={`${g.teeTime}-${gi}`}
                type="button"
                onClick={onOpenAll}
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
                className="active:opacity-80 transition-opacity"
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: INK_FAINT,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {meta}
                </div>
                {g.players.slice(0, 3).map((p, pi) => (
                  <div
                    key={`${pi}-${p.id ?? p.name}`}
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
            style={{
              minWidth: 122,
              flexShrink: 0,
              scrollSnapAlign: 'start',
              background: SURFACE,
              border: `1px dashed ${HAIRLINE_INK_8}`,
              borderRadius: 14,
              padding: '14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              fontFamily: FONT,
              color: INK_MUTE,
            }}
            className="active:opacity-80 transition-opacity"
          >
            <ChevronRight size={20} strokeWidth={2} aria-hidden />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: INK_MUTE, textAlign: 'center' }}>
              {actionLabel}
            </span>
          </button>
        </div>
      )}
    </section>
  );
}

export default TeeTimesRail;
