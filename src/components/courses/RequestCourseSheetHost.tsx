import { useEffect } from 'react';
import { RequestCourseSheet } from './RequestCourseSheet';
import { useRequestCourseSheetState, closeRequestCourseSheet } from './requestCourseSheetStore';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { useGuestActionGate } from '@/features/guest/useGuestActionGate';

/**
 * Singleton host for the Request-a-Course bottom sheet.
 * Mounted once at the app root so the sheet survives any overlay/sheet
 * that triggers it (search overlay, course search sheet, etc.) unmounting.
 *
 * GUEST BROWSING §5: requesting a course needs an account — a guest request
 * opens the join card instead of the sheet, and nothing is sent.
 */
export function RequestCourseSheetHost() {
  const { open, prefillName, homeClub } = useRequestCourseSheetState();
  const isGuest = useIsGuest();
  const gate = useGuestActionGate();
  useEffect(() => {
    if (open && isGuest) {
      closeRequestCourseSheet();
      gate('request_course');
    }
  }, [open, isGuest, gate]);
  if (isGuest) return null;
  return (
    <RequestCourseSheet
      open={open}
      onOpenChange={(o) => { if (!o) closeRequestCourseSheet(); }}
      prefillName={prefillName}
      homeClub={homeClub}
    />
  );
}

export default RequestCourseSheetHost;
