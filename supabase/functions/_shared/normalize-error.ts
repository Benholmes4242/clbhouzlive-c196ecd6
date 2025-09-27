export type NormalizedError = {
  name: string;
  message: string;
  stack?: string;
};

export function normalizeError(e: unknown): NormalizedError {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  return { name: typeof e, message: String(e) };
}