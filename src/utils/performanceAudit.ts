/**
 * Performance Audit Utilities — inert stub (Stage E teardown).
 * MediaRuntime is deleted; audit surfaces are unwired but the API is kept
 * so any console callers or window.mediaAudit references keep resolving.
 */

export const initMediaAudit = async () => {};

export const startAudit = () => {};
export const endAudit = () => ({});
export const getAuditSummary = () => ({});
export const measureVideoTTFF = () => null;

if (typeof window !== 'undefined') {
  (window as any).mediaAudit = {
    runtime: () => ({}),
    start: startAudit,
    end: endAudit,
    summary: getAuditSummary,
  };
}
