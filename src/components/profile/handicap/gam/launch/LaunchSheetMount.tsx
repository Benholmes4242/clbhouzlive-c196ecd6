import React, { useEffect, useState } from 'react';
import LaunchSheet from './LaunchSheet';
import { useLaunchSheetState } from './_internal/useLaunchSheetState';

interface LaunchSheetMountProps {
  userId: string;
}

/**
 * Decides when to show the one-shot gam launch sheet.
 *
 * Show when:
 *   - We have a payload back from `get_gam_launch_payload`
 *   - `launch_seen_at` is NULL (never dismissed)
 *
 * Caller (TodayView) is responsible for the friend-view guard
 * (`!readOnly`) — if this component never mounts, it never fires.
 *
 * Dismissal writes `gam_launch_seen_at = now()` to `user_profiles`
 * and optimistically updates the cached payload so the sheet stays
 * closed for the rest of the session.
 */
export const LaunchSheetMount: React.FC<LaunchSheetMountProps> = ({ userId }) => {
  const { payload, shouldShow, dismiss } = useLaunchSheetState(userId);
  const [open, setOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  // Open the sheet ~400ms after the payload says we should — gives
  // Today tab a chance to paint first so this lands as a sheet, not
  // a blocking modal on top of an empty page.
  useEffect(() => {
    if (!shouldShow || hasDismissed) return;
    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, [shouldShow, hasDismissed]);

  const handleDismiss = () => {
    setOpen(false);
    setHasDismissed(true);
    dismiss.mutate();
  };

  if (!shouldShow && !open) return null;

  return <LaunchSheet open={open} payload={payload} onDismiss={handleDismiss} />;
};

export default LaunchSheetMount;
