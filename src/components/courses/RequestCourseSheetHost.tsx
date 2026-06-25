import { RequestCourseSheet } from './RequestCourseSheet';
import { useRequestCourseSheetState, closeRequestCourseSheet } from './requestCourseSheetStore';

/**
 * Singleton host for the Request-a-Course bottom sheet.
 * Mounted once at the app root so the sheet survives any overlay/sheet
 * that triggers it (search overlay, course search sheet, etc.) unmounting.
 */
export function RequestCourseSheetHost() {
  const { open, prefillName } = useRequestCourseSheetState();
  return (
    <RequestCourseSheet
      open={open}
      onOpenChange={(o) => { if (!o) closeRequestCourseSheet(); }}
      prefillName={prefillName}
    />
  );
}

export default RequestCourseSheetHost;
