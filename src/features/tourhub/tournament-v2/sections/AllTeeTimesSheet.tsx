import { Skeleton } from '@/components/ui/skeleton';
/**
 * AllTeeTimesSheet — owns its round state. Renders the canonical Lens
 * segment (R1/R2/R3/R4), fetches per-round groups via useTeeTimesAll,
 * and gracefully handles undrawn rounds (segment disabled at 35% opacity;
 * "Draw released after Round {n−1}" if tapped anyway).
 *
 * Rounds are marked available when the tournament's current_round has
 * reached them (live/completed) or, for upcoming events, only Round 1.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';

import { useTeeTimesAll } from '../data/useTeeTimesAll';
import { TeeTimesFirstGroups } from './TeeTimesFirstGroups';
import { ScopeSegment, type ScopeSegmentOption } from '@/components/shared/ScopeSegment';
import { FONT, INK_MUTE, INK_FAINT, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';

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
}

export function AllTeeTimesSheet({
  open,
  onClose,
  tournamentId,
  tournamentName,
  defaultRound = 1,
  maxAvailableRound,
  drawnRounds,
}: Props) {
  const { t } = useTranslation('tourhub');
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

  // Reset to the current round each time the sheet opens.
  useEffect(() => {
    if (open) setRound(initial);
  }, [open, initial]);

  const roundNum = Number(round);
  const isDrawn = drawnSet.has(roundNum);

  const teeQuery = useTeeTimesAll(tournamentId, roundNum, { enabled: open && isDrawn });
  const groups = teeQuery.data ?? [];

  const options: ReadonlyArray<ScopeSegmentOption<RoundKey>> = useMemo(
    () =>
      (['1', '2', '3', '4'] as RoundKey[]).map((r) => ({
        value: r,
        label: t('tournament.allTeeTimes.roundShort', { round: r, defaultValue: `R${r}` }),
        disabled: !drawnSet.has(Number(r)),
      })),
    [t, drawnSet],
  );

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
              style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: A.INK, letterSpacing: '-0.01em' }}
            >
              {tournamentName}
            </h2>
          )}
          <div style={{ marginTop: 10 }}>
            <ScopeSegment
              value={round}
              onChange={(v) => setRound(v as RoundKey)}
              options={options}
              ariaLabel={t('tournament.allTeeTimes.roundScopeAria', { defaultValue: 'Round' })}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {!isDrawn ? (
            <div style={{ padding: '24px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK_MUTE, lineHeight: 1.5 }}>
                {t('tournament.allTeeTimes.roundEmpty', {
                  prev: roundNum - 1,
                  defaultValue: `Draw released after Round ${roundNum - 1}`,
                })}
              </div>
            </div>
          ) : teeQuery.isLoading ? (
            <div style={{ padding: '8px 16px' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0',
                    borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
                  }}
                >
                  <Skeleton style={{ width: 40, height: 12, borderRadius: 4 }} />
                  <Skeleton style={{ flex: 1, height: 12, borderRadius: 4 }} />
                  <Skeleton style={{ width: 36, height: 12, borderRadius: 4 }} />
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
          ) : (
            <TeeTimesFirstGroups groups={groups} limit={9999} surface="transparent" />
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
