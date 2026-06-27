/**
 * TournamentHero — Gold champion card on SLATE_50 (no full-bleed image).
 * Pills row (tour + optional MAJOR), name/venue/date column, purse stat,
 * and a champion strip (winner) / live indicator / upcoming caption.
 */

import { Link } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { Trophy } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import type { TourTournament } from '../../hooks/useTourHubData';
import { isAnyMajor } from '../../utils/majorScope';
import {
  AMBER, GOLD_BORDER, GOLD_DEEP, GOLD_TINT, GOLD_TINT_10,
  INK, INK_FAINT, INK_MUTE, SCORE_OVER_PAR_LIGHT, SLATE_50, STATUS_LIVE,
} from '../../_shared/tokens';

interface LbWinner {
  position: number;
  score: number | null;
  player?: { id: string; full_name: string; country?: string | null; country_code?: string | null };
}

interface TournamentHeroProps {
  tournament: TourTournament;
  leaderboard?: LbWinner[] | null | undefined;
  isLive?: boolean;
  isCompleted?: boolean;
  isUpcoming?: boolean;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

export function TournamentHero({ tournament, leaderboard, isLive, isCompleted, isUpcoming }: TournamentHeroProps) {
  const formattedPurse = tournament.purse ? `$${(tournament.purse / 1_000_000).toFixed(1)}M` : null;
  const dateRange = tournament.start_date && tournament.end_date
    ? formatDateRange(tournament.start_date, tournament.end_date)
    : null;
  const tourLabel = tournament.tour_full_name ?? tournament.tour_code ?? '';
  const major = isAnyMajor(tournament.name);

  const venueLine = [tournament.venue_name, tournament.venue_city].filter(Boolean).join(' · ');

  const winner = isCompleted
    ? (leaderboard ?? []).find((e) => e.position === 1) ?? (leaderboard ?? [])[0] ?? null
    : null;

  const currentRound = (tournament as any).current_round as number | null | undefined;

  return (
    <div style={{ background: SLATE_50, padding: '10px 0 14px' }}>

      <div style={{ margin: '0 16px' }}>
        <div
          style={{
            background: `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 14,
            padding: 14,
          }}
        >
          {/* Pills row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {tourLabel && (
              <span style={{
                padding: '3px 7px', background: '#1E3A8A', color: '#fff',
                fontSize: 9, fontWeight: 800, borderRadius: 3, letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>{tourLabel}</span>
            )}
            {major && (
              <span style={{
                padding: '3px 7px', background: '#FFF', border: `1px solid ${GOLD_BORDER}`,
                color: GOLD_DEEP, fontSize: 9, fontWeight: 800, borderRadius: 3, letterSpacing: '0.04em',
              }}>★ MAJOR</span>
            )}
          </div>

          {/* Body row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 22, fontWeight: 800, color: INK, lineHeight: 1.05,
                letterSpacing: '-0.01em', margin: 0,
              }}>
                {tournament.name}
              </h1>
              {venueLine && (
                <div style={{ fontSize: 12, fontWeight: 600, color: INK_MUTE, marginTop: 5 }}>
                  {venueLine}
                </div>
              )}
              {dateRange && (
                <div style={{ fontSize: 11, fontWeight: 600, color: INK_FAINT, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {dateRange}
                </div>
              )}
            </div>
            {formattedPurse && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: INK, lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
                }}>{formattedPurse}</div>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: INK_MUTE,
                  letterSpacing: '0.12em', marginTop: 3,
                }}>PURSE</div>
              </div>
            )}
          </div>

          {/* Champion / live / upcoming strip */}
          {isCompleted && winner && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${GOLD_BORDER}`,
            }}>
              <Trophy size={14} color={GOLD_DEEP} strokeWidth={2.2} />
              <CountryFlag country={winner.player?.country ?? winner.player?.country_code} size="sm" />
              <span style={{ fontSize: 13, fontWeight: 800, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {winner.player?.full_name ?? 'Champion'}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: (winner.score ?? 0) < 0 ? SCORE_OVER_PAR_LIGHT : INK,
                marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
              }}>
                {formatScore(winner.score)}
              </span>
            </div>
          )}

          {isLive && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${GOLD_BORDER}`,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: STATUS_LIVE,
                boxShadow: `0 0 0 3px rgba(16,185,129,0.18)`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 800, color: STATUS_LIVE,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>
                Live
              </span>
            </div>
          )}

          {isUpcoming && tournament.start_date && (
            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${GOLD_BORDER}`,
              fontSize: 11, fontWeight: 700, color: INK_MUTE,
              letterSpacing: '0.10em', textTransform: 'uppercase',
            }}>
              Starts {format(new Date(tournament.start_date), 'MMM d')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
