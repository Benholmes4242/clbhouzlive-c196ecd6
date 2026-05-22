/**
 * Listens for the legacy `legend-status-sheet:open` event dispatched by
 * `LegendStatusCard` and routes it to the unified Trophy Room sheet
 * via `openGamAchievements`. Mount once in `TodayView`.
 */
import React, { useEffect } from 'react';
import { openGamAchievements } from '../../whs/gam/events';

export const LegendStatusSheetMount: React.FC = () => {
  useEffect(() => {
    const handler = () => openGamAchievements();
    window.addEventListener('legend-status-sheet:open', handler);
    return () => window.removeEventListener('legend-status-sheet:open', handler);
  }, []);
  return null;
};

export default LegendStatusSheetMount;
