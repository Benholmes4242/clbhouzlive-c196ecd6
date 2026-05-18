import React, { useEffect, useState } from 'react';
import { LeaguesSheet } from './LeaguesSheet';

interface SheetState {
  open: boolean;
  userId: string;
}

interface OpenEventDetail {
  userId: string;
}

/**
 * Subscribes to the global `leagues-sheet:open` event dispatched by
 * `LeaguesCard`. Mount once in `TodayView`.
 */
export const LeaguesSheetMount: React.FC = () => {
  const [state, setState] = useState<SheetState>({ open: false, userId: '' });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenEventDetail>).detail;
      if (!detail?.userId) return;
      setState({ open: true, userId: detail.userId });
    };
    window.addEventListener('leagues-sheet:open', handler);
    return () => window.removeEventListener('leagues-sheet:open', handler);
  }, []);

  if (!state.userId) return null;

  return (
    <LeaguesSheet
      open={state.open}
      onClose={() => setState((s) => ({ ...s, open: false }))}
      userId={state.userId}
    />
  );
};

export default LeaguesSheetMount;
