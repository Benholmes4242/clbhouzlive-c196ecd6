/**
 * HeroSection — TD1 full-bleed cinematic hero.
 * Course image (useSingleCourseImage) under a house dark gradient scrim.
 * Status chip + name + venue meta + a glass STATE PANEL whose contents
 * pivot on `state`: live -> LEADER row, upcoming -> DAYS + Defending +
 * Purse, completed -> CHAMPION strip.
 */
import { format, differenceInCalendarDays } from 'date-fns';
import { Trophy } from 'lucide-react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatPurse } from '../../components/shared/TourHeroHelpers';
import { isAnyMajor } from '../../utils/majorScope';
import {
  FONT, GOLD, WHITE_ALPHA_10, WHITE_ALPHA_30, WHITE_ALPHA_65,
  STATUS_LIVE, SCORE_UNDER_PAR_DARK,
} from '../../_shared/tokens';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';

const HERO_MIN_H = 240;

interface LbEntry {
  position: number | null;
  score: number | null;
  today?: number | null;
  thru?: number | null;
  player?: { id?: string; full_name?: string; country?: string | null; country_code?: string | null; photo_url?: string | null } | null;
}

interface Props {
  meta: TournamentMeta;
  state: EventState;
  imageUrl: string | null;
  tourCode: string;
  leaderboard: LbEntry[] | undefined;
}

function fmtScoreSigned(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : String(n);
}

export function HeroSection({ meta, state, imageUrl, tourCode, leaderboard }: Props) {
  const major = meta.name ? isAnyMajor(meta.name) : false;
  const startDate = meta.start_date ? new Date(meta.start_date) : null;
  const daysUntil = startDate ? Math.max(0, differenceInCalendarDays(startDate, new Date())) : null;
  const startsDay = startDate ? format(startDate, 'EEE MMM d').toUpperCase() : null;

  const bg = imageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%), url("${imageUrl}") center/cover no-repeat`
    : 'linear-gradient(180deg, #0A0E14 0%, #1A2130 100%)';

  const leader = state === 'live'
    ? (leaderboard ?? []).find((e) => e.position === 1) ?? (leaderboard ?? [])[0] ?? null
    : null;
  const champion = state === 'completed'
    ? (leaderboard ?? []).find((e) => e.position === 1) ?? (leaderboard ?? [])[0] ?? null
    : null;

  const venueLine = [
    meta.venue_name,
    meta.venue_par ? `Par ${meta.venue_par}` : null,
    meta.venue_yardage ? `${meta.venue_yardage.toLocaleString()} yds` : null,
  ].filter(Boolean).join(' · ');

  const statusChip = (() => {
    if (state === 'live') {
      const round = meta.current_round ?? 1;
      return {
        label: `LIVE · R${round}`,
        bg: 'rgba(16,185,129,0.20)', border: 'rgba(16,185,129,0.50)', color: '#6EE7B7',
      };
    }
    if (state === 'completed') {
      return { label: 'FINAL', bg: WHITE_ALPHA_10, border: WHITE_ALPHA_30, color: '#fff' };
    }
    if (startsDay) {
      const label = major ? `MAJOR · STARTS ${startsDay}` : `STARTS ${startsDay}`;
      return {
        label,
        bg: major ? 'rgba(255,184,0,0.16)' : WHITE_ALPHA_10,
        border: major ? 'rgba(255,184,0,0.42)' : WHITE_ALPHA_30,
        color: major ? '#FCD34D' : '#fff',
      };
    }
    return null;
  })();

  return (
    <div
      style={{
        position: 'relative',
        minHeight: `calc(${HERO_MIN_H}px + env(safe-area-inset-top, 0px))`,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
        background: bg,
        fontFamily: FONT,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div style={{ padding: '16px' }}>
        {statusChip && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 8px', borderRadius: 4,
              background: statusChip.bg, border: `1px solid ${statusChip.border}`,
              fontSize: 9.5, fontWeight: 800, color: statusChip.color,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {statusChip.label}
          </div>
        )}
        <h1
          style={{
            fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.05,
            letterSpacing: '-0.01em', margin: 0,
          }}
        >
          {meta.name}
        </h1>
        {venueLine && (
          <div
            style={{
              fontSize: 11.5, fontWeight: 600, color: WHITE_ALPHA_65,
              marginTop: 6, fontVariantNumeric: 'tabular-nums',
            }}
          >
            {venueLine}
          </div>
        )}

        {/* STATE PANEL */}
        <div
          style={{
            marginTop: 12,
            background: 'rgba(0,0,0,0.30)',
            backdropFilter: 'blur(8px) saturate(140%)',
            WebkitBackdropFilter: 'blur(8px) saturate(140%)',
            border: `1px solid ${WHITE_ALPHA_10}`,
            borderRadius: 12,
            padding: 12,
          }}
        >
          {state === 'live' && leader && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 8.5, fontWeight: 800, color: WHITE_ALPHA_65, letterSpacing: '0.14em', textTransform: 'uppercase', width: 54, flexShrink: 0 }}>
                Leader
              </div>
              <PlayerAvatar
                playerId={leader.player?.id ?? ''}
                playerName={leader.player?.full_name ?? ''}
                tourCode={tourCode}
                photoUrl={leader.player?.photo_url ?? null}
                size="sm"
                ringColor={LIGHT_HAIRLINE}
              />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {leader.player?.full_name ?? 'TBD'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 200, color: (leader.score ?? 0) < 0 ? SCORE_UNDER_PAR_DARK : '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {fmtScoreSigned(leader.score)}
              </div>
            </div>
          )}

          {state === 'upcoming' && (
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8.5, fontWeight: 800, color: WHITE_ALPHA_65, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Days
                </div>
                <div style={{ fontSize: 26, fontWeight: 200, color: major ? GOLD : '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05 }}>
                  {daysUntil != null ? daysUntil : '—'}
                </div>
              </div>
              {meta.defending_champion && (
                <>
                  <div style={{ width: 1, background: WHITE_ALPHA_10 }} />
                  <div style={{ flex: 1.4, minWidth: 0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 800, color: WHITE_ALPHA_65, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      Defending
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meta.defending_champion}
                    </div>
                  </div>
                </>
              )}
              {meta.purse != null && (
                <>
                  <div style={{ width: 1, background: WHITE_ALPHA_10 }} />
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 8.5, fontWeight: 800, color: WHITE_ALPHA_65, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      Purse
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                      {formatPurse(meta.purse)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {state === 'completed' && champion && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(90deg, rgba(255,184,0,0.14) 0%, rgba(255,184,0,0.02) 100%)',
                border: `1px solid rgba(255,184,0,0.32)`,
                borderRadius: 10, padding: '8px 10px',
              }}
            >
              <Trophy size={16} color={GOLD} strokeWidth={2.2} />
              <PlayerAvatar
                playerId={champion.player?.id ?? ''}
                playerName={champion.player?.full_name ?? ''}
                tourCode={tourCode}
                photoUrl={champion.player?.photo_url ?? null}
                size="sm"
                ringColor={LIGHT_HAIRLINE}
              />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {champion.player?.full_name ?? 'Champion'}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FCD34D', fontVariantNumeric: 'tabular-nums' }}>
                {fmtScoreSigned(champion.score)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
