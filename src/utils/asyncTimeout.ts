/**
 * Async Timeout Utility
 * Wraps promises with timeouts to prevent hanging forever on native calls
 */

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve within the timeout.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Wraps a promise with a timeout, returning a default value instead of rejecting
 */
export function withTimeoutDefault<T>(
  promise: Promise<T>,
  timeoutMs: number,
  defaultValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(defaultValue), timeoutMs)
    ),
  ]);
}
