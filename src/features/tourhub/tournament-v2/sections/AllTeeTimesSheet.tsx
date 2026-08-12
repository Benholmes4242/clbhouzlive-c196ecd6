/**
 * AllTeeTimesSheet - owns its round state. Renders the canonical Lens
 * segment (R1/R2/R3/R4), fetches per-round groups via useTeeTimesAll,
 * and gracefully handles undrawn rounds (segment disabled; "Draw released
 * after Round {n-1}" if tapped anyway).
 *
 * Rounds are marked available when the tournament's current_round has
 * reached them (live/completed) or, for upcoming events, only Round 1.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TITLE, FIGS as TFIGS } from '@/lib/tokens/type';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { useTeeTimesAll } from '../data/useTeeTimesAll';
import { TeeTimesFirstGroups } from './TeeTimesFirstGroups';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { ScopeSegment, type ScopeSegmentOption } from '@/components/shared/ScopeSegment';
import { FONT, INK, INK_MUTE, INK_FAINT } from '../../_shared/tokens';
import { A, KICKER, LABEL, CAPTION } from '@/features/courses/components/holes/analytical/tokens';

type RoundKey = '1' | '2' | '3' | '4';

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: string | null | undefined;
  tournamentName: string | null;
  /** Round to open on (from tournament meta). Defaults to 1. */
  defaultRound?: number;
  /**
   * Highest drawn round. Rounds > this appear disabled with a graceful
   * empty state if tapped. Defaults to defaultRound.
   */
  maxAvailableRound?: number;
  /**
   * Exact set of rounds that have tee-time rows. When provided this wins over
   * maxAvailableRound, so a gap (R1, R2, R4 drawn) is handled correctly.
   */
  drawnRounds?: readonly number[];
  /** Leaderboard rows already on the page; used for position + score. */
  entries?: BoardEntry[];
}

export function AllTeeTimesSheet({
  open,
  onClose,
  tournamentId,
  tournamentName,
  defaultRound = 1,
  maxAvailableRound,
  drawnRounds,
  entries,
}: Props) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const maxDrawn = Math.min(4, Math.max(1, maxAvailableRound ?? defaultRound));

  // Availability comes from the data when we have it; otherwise fall back to
  // the max-round behaviour so nothing regresses on an error / empty query.
  const drawnSet = useMemo(() => {
    const list = (drawnRounds ?? []).filter((n) => n >= 1 && n <= 4);
    if (list.length > 0) return new Set<number>(list);
    const fallback = new Set<number>();
    for (let r = 1; r <= maxDrawn; r++) fallback.add(r);
    return fallback;
  }, [drawnRounds, maxDrawn]);

  // Open on the current round, clamped to a round that actually has data.
  const initial = useMemo(() => {
    const wanted = Math.min(4, Math.max(1, defaultRound));
    if (drawnSet.has(wanted)) return String(wanted) as RoundKey;
    const available = [...drawnSet].sort((a, b) => a - b);
    const atOrBelow = available.filter((n) => n <= wanted).pop();
    return String(atOrBelow ?? available[0] ?? wanted) as RoundKey;
  }, [defaultRound, drawnSet]);

  const [round, setRound] = useState<RoundKey>(initial);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);

  // Reset to the current round each time the sheet opens.
  useEffect(() => {
    if (open) setRound(initial);
  }, [open, initial]);

  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('tour_tournament_tee_times_opened', {
      tournament_id: tournamentId ?? null,
      round: Number(initial),
    });
    // Fire once per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  const roundNum = Number(round);
  const isDrawn = drawnSet.has(roundNum);

  const teeQuery = useTeeTimesAll(tournamentId, roundNum, { enabled: open && isDrawn });
  const groups = teeQuery.data ?? [];

  const filteredGroups = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.players.some((p) => p.name.toLowerCase().includes(q)));
  }, [groups, debouncedSearch]);

  const isSearching = debouncedSearch.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const q = debouncedSearch.trim();
    if (q.length === 0) return;
    analyticsEvents.track('tour_tournament_tee_times_searched', {
      tournament_id: tournamentId ?? null,
      round: roundNum,
      query_length: q.length,
      results: filteredGroups.length,
    });
    // Debounced value only - not per keystroke, and never the query text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, open, roundNum]);

  const handlePlayerTap = useCallback(
    (playerId: string, hasScore: boolean) => {
      analyticsEvents.track('tour_tournament_tee_player_tapped', {
        tournament_id: tournamentId ?? null,
        round: roundNum,
        player_id: playerId,
        has_score: hasScore,
      });
      onClose();
      setTimeout(() => navigate(`/tourhub/player/${playerId}`), 60);
    },
    [navigate, onClose, tournamentId, roundNum],
  );

  const options: ReadonlyArray<ScopeSegmentOption<RoundKey>> = useMemo(
    () =>
      (['1', '2', '3', '4'] as RoundKey[]).map((r) => ({
        value: r,
        label: t('tournament.allTeeTimes.roundShort', { round: r, defaultValue: `R${r}` }),
        disabled: !drawnSet.has(Number(r)),
      })),
    [t, drawnSet],
  );

  const playerCount = groups.reduce((s, g) => s + g.players.length, 0);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={A.PANEL}
      ariaLabelledBy="tournament-tee-times-sheet-title"
      style={{ height: '75dvh', maxHeight: '75dvh' }}
    >
      <div style={{ background: A.PANEL, fontFamily: FONT, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 16px 10px' }}>
          <div style={KICKER}>{t('tournament.allTeeTimes.title')}</div>
          {tournamentName && (
            <h2
              id="tournament-tee-times-sheet-title"
              style={{ margin: '3px 0 0', ...TITLE, color: A.INK }}
            >
              {tournamentName}
            </h2>
          )}
          {groups.length > 0 && (
            <div style={{ ...LABEL, marginTop: 5 }}>
              {t('tournament.allTeeTimes.sub', {
                groups: groups.length,
                players: playerCount,
                round: roundNum,
                defaultValue: `${groups.length} groups . ${playerCount} players . round ${roundNum}`,
              })}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <ScopeSegment
              value={round}
              onChange={(v) => setRound(v as RoundKey)}
              options={options}
              ariaLabel={t('tournament.allTeeTimes.roundScopeAria', { defaultValue: 'Round' })}
            />
          </div>
          {isDrawn && groups.length > 0 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: '#F8FAFC',
                border: `0.5px solid ${INK_FAINT}33`,
                borderRadius: 18,
                padding: '7px 12px',
              }}
            >
              <Search size={13} color={INK_FAINT} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('tournament.allTeeTimes.searchPlaceholder', { defaultValue: 'Find a player' })}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  fontFamily: FONT,
                  color: INK,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {!isDrawn ? (
            <div style={{ padding: '24px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK_MUTE, lineHeight: 1.5, ...TFIGS }}>
                {t('tournament.allTeeTimes.roundEmpty', {
                  prev: roundNum - 1,
                  defaultValue: `Draw released after Round ${roundNum - 1}`,
                })}
              </div>
            </div>
          ) : teeQuery.isLoading ? (
            <div style={{ padding: '8px 0' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr 62px',
                    padding: '13px 16px',
                  }}
                >
                  <div>
                    <Skeleton style={{ width: 40, height: 13, borderRadius: 4 }} />
                    <Skeleton style={{ width: 30, height: 8, borderRadius: 4, marginTop: 5 }} />
                  </div>
                  <div style={{ gridColumn: '2 / 4', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton style={{ width: '62%', height: 12, borderRadius: 4 }} />
                    <Skeleton style={{ width: '54%', height: 12, borderRadius: 4 }} />
                    <Skeleton style={{ width: '58%', height: 12, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div style={{ padding: '24px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK_FAINT, lineHeight: 1.5 }}>
                {t('tournament.allTeeTimes.noGroups', {
                  defaultValue: 'No tee times available for this round.',
                })}
              </div>
            </div>
          ) : filteredGroups.length === 0 && isSearching ? (
            <div style={{ padding: '24px 16px' }}>
              <div style={{ ...CAPTION, textAlign: 'center', lineHeight: 1.5 }}>
                {t('tournament.allTeeTimes.noMatch', {
                  defaultValue: "No player in this round's draw matches that name.",
                })}
              </div>
            </div>
          ) : (
            <TeeTimesFirstGroups groups={filteredGroups} entries={entries} onPlayerTap={handlePlayerTap} />
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
