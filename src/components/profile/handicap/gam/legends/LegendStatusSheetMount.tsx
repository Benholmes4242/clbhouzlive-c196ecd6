import React, { useEffect, useState } from 'react';
import { LegendStatusSheet } from './LegendStatusSheet';

interface SheetState {
  open: boolean;
  userId: string;
  readOnly: boolean;
  friendName?: string;
}

interface OpenEventDetail {
  userId: string;
  readOnly?: boolean;
  friendName?: string;
}

/**
 * Subscribes to the global `legend-status-sheet:open` event dispatched by
 * `LegendStatusCard`. Mount once in `TodayView`.
 */
export const LegendStatusSheetMount: React.FC = () => {
  const [state, setState] = useState<SheetState>({
    open: false,
    userId: '',
    readOnly: false,
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenEventDetail>).detail;
      if (!detail?.userId) return;
      setState({
        open: true,
        userId: detail.userId,
        readOnly: detail.readOnly ?? false,
        friendName: detail.friendName,
      });
    };
    window.addEventListener('legend-status-sheet:open', handler);
    return () => window.removeEventListener('legend-status-sheet:open', handler);
  }, []);

  if (!state.userId) return null;

  return (
    <LegendStatusSheet
      open={state.open}
      onClose={() => setState((s) => ({ ...s, open: false }))}
      userId={state.userId}
      readOnly={state.readOnly}
      friendName={state.friendName}
    />
  );
};

export default LegendStatusSheetMount;
