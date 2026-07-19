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
import { AMBER, FONT, INK, INK_MUTE, INK_FAINT, SLATE_50, HAIRLINE_INK_8 } from '../../_shared/tokens';

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
}

export function AllTeeTimesSheet({
  open,
  onClose,
  tournamentId,
  tournamentName,
  defaultRound = 1,
  maxAvailableRound,
}: Props) {
  const { t } = useTranslation('tourhub');
  const initial = String(Math.min(4, Math.max(1, defaultRound))) as RoundKey;
  const [round, setRound] = useState<RoundKey>(initial);

  // Reset to the current round each time the sheet opens.
  useEffect(() => {
    if (open) setRound(initial);
  }, [open, initial]);

  const maxDrawn = Math.min(4, Math.max(1, maxAvailableRound ?? defaultRound));
  const roundNum = Number(round);
  const isDrawn = roundNum <= maxDrawn;

  const teeQuery = useTeeTimesAll(tournamentId, roundNum, { enabled: open && isDrawn });
  const groups = teeQuery.data ?? [];

  const options: ReadonlyArray<ScopeSegmentOption<RoundKey>> = useMemo(
    () =>
      (['1', '2', '3', '4'] as RoundKey[]).map((r) => ({
        value: r,
        label: t('tournament.allTeeTimes.roundShort', { round: r, defaultValue: `R${r}` }),
        disabled: Number(r) > maxDrawn,
      })),
    [t, maxDrawn],
  );

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={SLATE_50} style={{ height: '75dvh', maxHeight: '75dvh' }}>
      <div style={{ background: SLATE_50, fontFamily: FONT, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '4px 16px 10px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {t('tournament.allTeeTimes.title')}
          </div>
          {tournamentName && (
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginTop: 4, letterSpacing: '-0.01em' }}>
              {tournamentName}
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
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
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
                  className="animate-pulse"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0',
                    borderBottom: `0.5px solid ${HAIRLINE_INK_8}`,
                  }}
                >
                  <div style={{ width: 40, height: 12, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} />
                  <div style={{ flex: 1, height: 12, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} />
                  <div style={{ width: 36, height: 12, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} />
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
