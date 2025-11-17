import { usePostSanityCheck } from '@/hooks/usePostSanityCheck';

const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Dev-only panel that shows the count of orphaned posts (posts without media).
 * Only visible in development mode. See docs/dev/post-sanity-check.md for SQL queries.
 */
export function PostSanityDevPanel() {
  const { count, loading, error } = usePostSanityCheck(IS_DEV);

  if (!IS_DEV) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 rounded-lg border border-border bg-card p-3 text-sm shadow-lg max-w-xs">
      <div className="font-medium mb-1 text-foreground">Post Sanity Check</div>
      {loading && <div className="text-muted-foreground">Checking…</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="text-foreground">
          Posts without media (non-achievement): <span className="font-semibold">{count ?? 0}</span>
        </div>
      )}
      {!loading && !error && count !== null && count > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          See <code>docs/dev/post-sanity-check.md</code>
        </div>
      )}
    </div>
  );
}
