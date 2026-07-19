// Temporary fence-proof file. Import a forbidden V1 module — ESLint
// should error on this line under the fsv2 no-restricted-imports rule.
// eslint-disable-next-line
import { openWithOrigin } from '@/lib/openWithOrigin';
export const _proof = openWithOrigin;
