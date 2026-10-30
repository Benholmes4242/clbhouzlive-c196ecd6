/** Transport-level observation preserves the server response and all data.
 * A registered UI handler decides whether the current session is a guest.
 * This module must not import the client/store: the client owns this fetch.
 */
type RefusalHandler = () => boolean;
let refusalHandler: RefusalHandler | undefined;
let suppressError: (() => boolean) | undefined;

export function registerGuestServerHandler(handler: RefusalHandler, suppress: () => boolean): void {
  refusalHandler = handler;
  suppressError = suppress;
}

export function handleGuestServerError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown };
  if (candidate.code !== '42501' || candidate.message !== 'guests_cannot_write') return false;
  return refusalHandler?.() ?? false;
}

export function suppressGuestServerToast(): boolean {
  return suppressError?.() ?? false;
}

export async function guestAwareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) {
    try { handleGuestServerError(await response.clone().json()); } catch { /* non-JSON failures retain normal handling */ }
  }
  return response;
}