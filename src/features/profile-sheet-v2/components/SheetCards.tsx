/**
 * ProfileSheetV2 · the card stack between the actor pills and quick actions,
 * driven ONLY by the sheet's one state (sheetState.ts, S.2):
 *   unsettled / business / hidden → nothing
 *   none     → connect card          (no form, no courses)
 *   manual   → manual card           (no form, no courses — there is no manual round entry)
 *   syncing  → syncing card          (no form, no courses)
 *   failing  → not-syncing card      (no form, no courses)
 *   ready    -> no card; SheetNavGroup owns the connected Handicap door.
 */
import React from 'react';
import type { FormBar, SheetHcpState } from '../sheetState';
import { ConnectCard, ManualCard, SyncingCard, FailingCard } from './PreIndexCards';

interface HistoryPoint { observed_at: string; handicap_index: number }

interface Props {
  state: SheetHcpState;
  history90?: HistoryPoint[] | null;
  bars?: FormBar[];
  onNavigate: (route: string) => void;
  /** Injectable clock for tests. */
  now?: number;
}

export default function SheetCards({ state, onNavigate }: Props) {

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
      return null;
  }
}
