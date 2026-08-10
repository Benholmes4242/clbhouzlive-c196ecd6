import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * ONE distinction, not nine. Settings glyphs render inline with no tile:
 * normal rows in MUTE, the single irreversible row in RED.
 *
 * The old map carried seven names for one appearance plus a CONSTANT green on
 * `privacy` - a colour that signalled a status while carrying no information
 * about it, and green means under par or improved, nothing else.
 */
export type IconTheme = 'default' | 'danger';

export const iconThemeColor: Record<IconTheme, string> = {
  default: A.MUTE,
  danger: A.RED,
};
