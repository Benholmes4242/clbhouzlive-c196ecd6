/**
 * Legacy no-op shim.
 *
 * Studio-v2 bakes filters into image pixels at publish time, so we no longer
 * apply CSS filters at render time. Kept so existing consumers keep compiling
 * without surgical edits — both helpers return inert values.
 */

import type { FilterId } from '@/types/studio';

export function getFilterClass(_filter?: FilterId | string | null): string {
  return '';
}

export function getFilterStyle(_filter?: FilterId | string | null): string {
  return 'none';
}
