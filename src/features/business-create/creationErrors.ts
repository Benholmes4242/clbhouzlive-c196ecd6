/** Shared save reporting preserves the editor's create/edit error vocabulary. */
import { AppLog } from '@/lib/logger';
export class SaveStepError extends Error {
  constructor(public step: string, public cause: unknown) { super(errorText(cause) || step); }
}
export function pgFields(err: unknown) {
  const e = (err ?? {}) as { code?: string; message?: string; details?: string; hint?: string };
  return { code: e.code ?? null, message: e.message ?? String(err), details: e.details ?? null, hint: e.hint ?? null };
}
export function errorText(err: unknown): string {
  const { code, message, details } = pgFields(err);
  return [message, details, code ? `(${code})` : null].filter(Boolean).join(' ');
}
export const SESSION_ENDED_MSG = 'Your session has ended. Please sign in again; nothing has been saved yet.';
export function isAuthError(err: unknown): boolean {
  const { code, message } = pgFields(err);
  return code === 'PGRST301' || code === '42501' || /jwt|not authenticated|row-level security/i.test(message ?? '');
}
export function logSaveFailure(step: string, err: unknown, ctx: Record<string, unknown>) {
  AppLog.error('BusinessProfileEditor', `save failed at step: ${step}`, { step, ...ctx, ...pgFields(err), error: err });
}