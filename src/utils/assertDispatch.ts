/**
 * Ensures a browser event is emitted even if the source action fails to dispatch it.
 * Waits up to `timeoutMs` for the event before dispatching a fallback.
 *
 * @param eventName The DOM event name to listen for (e.g. 'game-created')
 * @param action The async function that is expected to emit this event
 * @param detail Optional event detail payload for the fallback dispatch (can be a function that receives the action result)
 * @param timeoutMs Max time to wait before manual dispatch (default: 500ms)
 */
export async function assertDispatch<T>(
  eventName: string,
  action: () => Promise<T>,
  detail?: Record<string, any> | ((result: T) => Record<string, any>),
  timeoutMs: number = 500
): Promise<T> {
  // Skip event logic if not in a browser environment
  if (typeof window === 'undefined') return action();

  let fired = false;
  const markFired = () => { fired = true; };

  // Track whether the event actually fired
  window.addEventListener(eventName, markFired, { once: true });

  // Run the main async action (e.g., createBeacon)
  const result = await action();

  // Wait up to timeoutMs for an event to appear naturally
  const timeout = new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  await Promise.race([
    new Promise<void>(resolve => {
      const check = () => {
        if (fired) resolve();
        else requestAnimationFrame(check);
      };
      check();
    }),
    timeout,
  ]);

  // If nothing fired, send a fallback event
  if (!fired) {
    console.warn(`[assertDispatch] '${eventName}' not emitted within ${timeoutMs} ms — dispatching manually.`);
    const eventDetail = typeof detail === 'function' ? detail(result) : detail;
    window.dispatchEvent(new CustomEvent(eventName, { detail: eventDetail }));
  }

  window.removeEventListener(eventName, markFired);
  return result;
}
