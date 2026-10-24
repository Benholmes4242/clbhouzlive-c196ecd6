/** CB78 Part A: who may open the business profile editor in edit mode, and which
 * fields an editor may send. The live guard_business_protected_fields trigger
 * refuses these for anyone but owners and admins (42501), so an editor's save
 * strips them before the update ever leaves the client. */

export const OWNER_ADMIN_ONLY_FIELDS = [
  'name', 'slug', 'category', 'club_id', 'club_key', 'club_name', 'notification_preferences',
  'is_verified', 'verified_at', 'verification_status', 'is_deleted', 'deleted_at', 'is_system_account',
] as const;

export function canEditBusinessProfile(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function protectBusinessPayload<T extends Record<string, unknown>>(payload: T, role: string | null | undefined): T {
  if (role === 'owner' || role === 'admin') return payload;
  const out: Record<string, unknown> = { ...payload };
  for (const key of OWNER_ADMIN_ONLY_FIELDS) delete out[key];
  return out as T;
}
