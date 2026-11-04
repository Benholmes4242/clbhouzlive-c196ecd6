/** FIX_RO_NOISE_1: "ResizeObserver loop limit exceeded" and "ResizeObserver loop
 * completed with undelivered notifications" are benign browser notices, never app errors. */
export function isResizeObserverNoise(message: unknown): boolean {
  return typeof message === 'string' && message.startsWith('ResizeObserver loop');
}
