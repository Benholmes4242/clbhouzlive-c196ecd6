/** Signup analytics use confirmation OR creation proximity to the first
 * sign-in, never timestamp string equality. Automatic clbhouz following is
 * database-owned; this helper has no side effects or follow authority. */
type SignupTimestamps = {
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  created_at?: string | null;
};

export function isNewSignup(user: SignupTimestamps | null | undefined, windowMs = 60_000): boolean {
  if (!user?.last_sign_in_at) return false;
  const signedIn = Date.parse(user.last_sign_in_at);
  if (!Number.isFinite(signedIn)) return false;
  const withinWindow = (timestamp: string | null | undefined) => {
    if (!timestamp) return false;
    const time = Date.parse(timestamp);
    return Number.isFinite(time) && Math.abs(signedIn - time) <= windowMs;
  };
  return withinWindow(user.email_confirmed_at ?? user.confirmed_at) || withinWindow(user.created_at);
}