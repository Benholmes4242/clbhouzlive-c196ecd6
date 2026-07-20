// reviewRetryRegistry — module-level jobId → retry-fn map.
//
// Chosen retry-wiring mechanism (per brief): a tiny in-memory registry.
// The review pipeline (useReviewMediaPipeline) registers a retry callback
// keyed by the pending job id at flush start, and unregisters on success
// or dismiss. PendingPostCard's review branch calls the callback directly.
//
// Why this and not uploadEventBus: the bus is post-shaped and lives inside
// the hard-fenced upload machinery. Emitting a new event would risk
// coupling; a private registry keeps the review path fully isolated.

type RetryFn = () => Promise<void>;

const registry = new Map<string, RetryFn>();

export const reviewRetryRegistry = {
  register(jobId: string, fn: RetryFn): void {
    registry.set(jobId, fn);
  },
  unregister(jobId: string): void {
    registry.delete(jobId);
  },
  get(jobId: string): RetryFn | undefined {
    return registry.get(jobId);
  },
};
