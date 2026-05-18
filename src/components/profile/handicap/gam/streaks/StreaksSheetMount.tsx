import React, { useEffect, useState } from 'react';
import { StreaksSheet } from './StreaksSheet';
import { allStreaksBus } from '../../whs/gam/events';

/**
 * Subscribes to the global `allStreaksBus` (fired by `StreaksCard` SEE ALL
 * and by the page header). Mount once in `TodayView`.
 */
export const StreaksSheetMount: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = allStreaksBus.subscribe(() => setOpen(true));
    return unsubscribe;
  }, []);

  return <StreaksSheet open={open} onClose={() => setOpen(false)} />;
};

export default StreaksSheetMount;
