/**
 * Shared "Share profile" behaviour for a business (BusinessProfilePage and the
 * business home header). Tracks `share_profile`, then uses the native share
 * sheet, else copies the link and toasts. One implementation so the two
 * entrypoints cannot drift.
 */
import { toast } from '@/lib/toast';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';

/** Adds `?src=share` to a profile URL (existing params preserved). */
export function withShareSource(url: string): string {
  const u = new URL(url);
  u.searchParams.set('src', 'share');
  return u.toString();
}

/** Absolute public profile URL for a business, tagged as a share. */
export function businessProfileShareUrl(slugOrId: string): string {
  return withShareSource(`${window.location.origin}/business/${slugOrId}`);
}

export async function shareBusinessProfile(opts: {
  businessId: string | null | undefined;
  name: string | null | undefined;
  url: string;
  userId?: string | null;
}): Promise<void> {
  const { businessId, name, url, userId } = opts;
  if (businessId) trackBusinessAction(businessId, 'share_profile', userId ?? undefined);
  if (navigator.share) {
    try { await navigator.share({ title: name ?? undefined, url }); } catch { /* user cancelled share */ }
  } else {
    await navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  }
}
