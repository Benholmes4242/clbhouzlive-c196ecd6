/**
 * fsv2 perf spans — thin wrappers over the app's vperf helpers. Span kinds
 * are new (`fsv2.open`, `fsv2.close`, `fsv2.swipe`) so v1's `fs.*`
 * dashboards keep reading the old names verbatim. Everything no-ops when
 * `isPerfEnabled()` is false.
 */

import { vperfStart, vperfMark, vperfEnd, vperfNextId } from '@/perf/vperf';
import { FSV2 } from '../tokens';

export type Fsv2MediaKind = 'image' | 'video' | 'carousel';

export function startOpenSpan(
  openId: string,
  kind: Fsv2MediaKind,
  meta: Record<string, unknown> = {},
): string {
  const spanId = `fsv2.open:${openId}`;
  const budgetMs =
    kind === 'image'
      ? FSV2.OPEN_BUDGET_MS_IMAGE
      : FSV2.OPEN_BUDGET_MS_VIDEO_COLD;
  vperfStart(spanId, 'fsv2.open', { budgetMs, openId, kind, ...meta });
  return spanId;
}

export function markOpen(spanId: string, phase: string): void {
  vperfMark(spanId, phase);
}

export function endOpen(
  spanId: string,
  extra: Record<string, unknown> = {},
): void {
  vperfEnd(spanId, extra);
}

export function startCloseSpan(openId: string): string {
  const spanId = `fsv2.close:${openId}`;
  vperfStart(spanId, 'fsv2.close', {
    budgetMs: FSV2.CLOSE_BUDGET_MS,
    openId,
  });
  return spanId;
}

export function endCloseSpan(spanId: string): void {
  vperfEnd(spanId, {});
}

export function startSwipeSpan(openId: string, direction: 'v' | 'h'): string {
  const id = `fsv2.swipe:${openId}:${vperfNextId('sw')}`;
  vperfStart(id, 'fsv2.swipe', {
    budgetMs: FSV2.SWIPE_BUDGET_MS,
    openId,
    direction,
  });
  return id;
}

export function endSwipeSpan(spanId: string): void {
  vperfEnd(spanId, {});
}
