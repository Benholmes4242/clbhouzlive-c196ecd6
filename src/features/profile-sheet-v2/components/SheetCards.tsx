/**
 * ProfileSheetV2 · the card stack between the actor pills and quick actions,
 * driven ONLY by the sheet's one state (sheetState.ts, S.2):
 *   unsettled / business / hidden → nothing
 *   none     → connect card          (no form, no courses)
 *   manual   → manual card           (no form, no courses — there is no manual round entry)
 *   syncing  → syncing card          (no form, no courses)
 *   failing  → not-syncing card      (no form, no courses)
 *   ready    → one "How you're playing" card (index + last five rounds, V6 D)
 */
import React, { useMemo, useState } from 'react';
import type { FormBar, SeriesPoint, SheetHcpState } from '../sheetState';
import { TrendCard } from './HcpStrip';
import { ConnectCard, ManualCard, SyncingCard, FailingCard } from './PreIndexCards';

interface HistoryPoint { observed_at: string; handicap_index: number }

interface Props {
  state: SheetHcpState;
  history90: HistoryPoint[] | null | undefined;
  bars: FormBar[];
  onNavigate: (route: string) => void;
  /** Injectable clock for tests. */
  now?: number;
}

export default function SheetCards({ state, history90, bars, onNavigate, now }: Props) {
  const [windowDays, setWindowDays] = useState<30 | 90>(90);
  // The 30-day window is a client-side slice of the SAME 90-day query.
  const points = useMemo<SeriesPoint[]>(() => {
    if (!history90) return [];
    const cutoff = windowDays === 90 ? 0 : (now ?? Date.now()) - windowDays * 86_400_000;
    return history90
      .filter((p) => !cutoff || new Date(p.observed_at).getTime() >= cutoff)
      .map((p) => ({ t: p.observed_at, v: p.handicap_index }));
  }, [history90, windowDays, now]);

  switch (state.kind) {
    case 'unsettled':
    case 'business':
    case 'hidden':
      return null;
    case 'none':
      return <ConnectCard onNavigate={onNavigate} />;
    case 'manual':
      return <ManualCard index={state.index} onNavigate={onNavigate} />;
    case 'syncing':
      return <SyncingCard body={state.body} />;
    case 'failing':
      return <FailingCard body={state.body} lastSyncedAt={state.lastSyncedAt} onNavigate={onNavigate} />;
    case 'ready':
      return (
        <TrendCard
            points={points}
            windowDays={windowDays}
            onWindow={setWindowDays}
            fallbackIndex={state.index}
            onNavigate={onNavigate}
            bars={bars}
          />
      );
  }
}
