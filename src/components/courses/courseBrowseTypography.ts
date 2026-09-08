import type { CSSProperties } from 'react';

import { KICKER } from '@/lib/tokens/type';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

/** Canonical factual label used above both Courses library descriptions. */
export const COURSE_BROWSE_KICKER: CSSProperties = {
  ...KICKER,
  color: INK_MUTE,
};

/** One supporting-copy treatment across Courses and Top 100. */
export const COURSE_BROWSE_DESCRIPTION: CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: INK_MUTE,
  lineHeight: 1.45,
  maxWidth: 330,
};