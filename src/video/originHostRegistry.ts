/**
 * originHostRegistry — module singleton mapping `ownerKey → tile lane host`.
 *
 * The fullscreen "borrow" flow re-parents a live rail lane's <video> element
 * from its tile into the viewer on open, then back on close. To return the
 * element on close we need to look up the origin tile's host by owner key.
 *
 * unregister only clears the entry if the stored element matches the caller's
 * element — guards against register/unregister races during remount, where a
 * new mount may register before the old mount's unregister fires.
 */

const hosts = new Map<string, HTMLElement>();

export const originHostRegistry = {
  register(ownerKey: string, hostEl: HTMLElement): void {
    hosts.set(ownerKey, hostEl);
  },
  unregister(ownerKey: string, hostEl?: HTMLElement | null): void {
    if (!hostEl) {
      hosts.delete(ownerKey);
      return;
    }
    const cur = hosts.get(ownerKey);
    if (cur === hostEl) hosts.delete(ownerKey);
  },
  get(ownerKey: string | null | undefined): HTMLElement | null {
    if (!ownerKey) return null;
    return hosts.get(ownerKey) ?? null;
  },
};
