import { toast as sonnerToast, type ExternalToast } from 'sonner';

const DEFAULT_DURATION = 2500;
const ERROR_DURATION = 4000;

/** Stable id from the message so identical toasts REPLACE instead of stack. */
function idFor(message: unknown): string | undefined {
  return typeof message === 'string' ? `t:${message}` : undefined;
}

function withDefaults(
  message: unknown,
  opts: ExternalToast | undefined,
  duration: number,
): ExternalToast {
  return {
    id: idFor(message),
    duration,
    ...opts, // explicit call-site id/duration still wins
  };
}

type Msg = Parameters<typeof sonnerToast>[0];

function base(message: Msg, opts?: ExternalToast) {
  return sonnerToast(message, withDefaults(message, opts, DEFAULT_DURATION));
}

export const toast = Object.assign(base, {
  success: (m: Msg, o?: ExternalToast) =>
    sonnerToast.success(m, withDefaults(m, o, DEFAULT_DURATION)),
  error: (m: Msg, o?: ExternalToast) =>
    sonnerToast.error(m, withDefaults(m, o, ERROR_DURATION)),
  info: (m: Msg, o?: ExternalToast) =>
    sonnerToast.info(m, withDefaults(m, o, DEFAULT_DURATION)),
  warning: (m: Msg, o?: ExternalToast) =>
    sonnerToast.warning(m, withDefaults(m, o, ERROR_DURATION)),
  message: (m: Msg, o?: ExternalToast) =>
    sonnerToast.message(m, withDefaults(m, o, DEFAULT_DURATION)),
  // Pass-throughs (no defaults injected):
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  custom: sonnerToast.custom,
});
