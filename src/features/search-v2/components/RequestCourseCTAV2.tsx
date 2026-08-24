// Thin wrapper around the canonical RequestCourseCTA (which owns the sheet
// open + course_requests insert). Reuses the hero card in the global
// no-results state and at the end of the Courses scope list.
import { RequestCourseCTA } from '@/components/courses/RequestCourseCTA';

interface Props {
  prefillName?: string;
  onBeforeOpen?: () => void;
}

export function RequestCourseCTAV2({ prefillName, onBeforeOpen }: Props) {
  return (
    <div style={{ padding: '18px 16px 24px' }}>
      <RequestCourseCTA
        variant="hero"
        tone="dark"
        prefillName={prefillName}
        onBeforeOpen={onBeforeOpen}
      />
    </div>
  );
}
