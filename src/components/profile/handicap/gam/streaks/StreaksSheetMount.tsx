import React, { useEffect, useState } from 'react';
import { StreaksSheet } from './StreaksSheet';
import { allStreaksBus } from '../../whs/gam/events';

/**
 * Subscribes to the global `allStreaksBus` (formerly fired by `StreaksCard` SEE ALL, deleted 10 Sep 2026
 * and by the page header).
 * Mount once at PAGE level in HandicapPage, beside GamMount. It was in
 * the deleted TodayView, which only rendered on the 'today' subtab and was keyed on the
 * subtab - so the ?gam=streaks deep link could fire before any subscriber
 * existed. A bus subscriber that only exists on one tab cannot serve a
 * deep link.
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
