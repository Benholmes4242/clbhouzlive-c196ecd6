import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ThreadMessage } from '@/types/messaging';

type ThreadInfinite = InfiniteData<ThreadMessage[], string | null>;

function threadKey(conversationId: string) {
  return ['messaging', 'thread', conversationId] as const;
}

function updateInfinite(
  queryClient: QueryClient,
  conversationId: string,
  updater: (prev: ThreadInfinite) => ThreadInfinite,
): void {
  queryClient.setQueryData<ThreadInfinite>(threadKey(conversationId), (prev) => {
    if (!prev) {
      // No cache yet: seed one page with nothing; caller will insert.
      return { pages: [[]], pageParams: [null] } as ThreadInfinite;
    }
    return updater(prev);
  });
}

/** Insert an optimistic message at the front of the newest page (get_thread is newest-first). */
export function insertOptimistic(
  queryClient: QueryClient,
  conversationId: string,
  msg: ThreadMessage,
): void {
  updateInfinite(queryClient, conversationId, (prev) => {
    const pages = prev.pages.slice();
    const head = pages[0] ? pages[0].slice() : [];
    head.unshift(msg);
    pages[0] = head;
    return { ...prev, pages };
  });
}

/** Merge server fields into the optimistic row (matched by client_id) and mark sent. */
export function resolveOptimistic(
  queryClient: QueryClient,
  conversationId: string,
  clientId: string,
  serverRow: Partial<ThreadMessage>,
): void {
  updateInfinite(queryClient, conversationId, (prev) => {
    const pages = prev.pages.map((page) =>
      page.map((m) =>
        m.client_id === clientId
          ? ({ ...m, ...serverRow, client_id: clientId, status: 'sent' } as ThreadMessage)
          : m,
      ),
    );
    return { ...prev, pages };
  });
}

/** Mark the optimistic row (matched by client_id) as failed. */
export function markFailed(
  queryClient: QueryClient,
  conversationId: string,
  clientId: string,
): void {
  updateInfinite(queryClient, conversationId, (prev) => {
    const pages = prev.pages.map((page) =>
      page.map((m) =>
        m.client_id === clientId ? ({ ...m, status: 'failed' } as ThreadMessage) : m,
      ),
    );
    return { ...prev, pages };
  });
}

/** Remove the optimistic row (matched by client_id) entirely. */
export function removeOptimistic(
  queryClient: QueryClient,
  conversationId: string,
  clientId: string,
): void {
  updateInfinite(queryClient, conversationId, (prev) => {
    const pages = prev.pages.map((page) => page.filter((m) => m.client_id !== clientId));
    return { ...prev, pages };
  });
}

/** Set an optimistic row back to 'sending' (used on retry). */
export function markSending(
  queryClient: QueryClient,
  conversationId: string,
  clientId: string,
): void {
  updateInfinite(queryClient, conversationId, (prev) => {
    const pages = prev.pages.map((page) =>
      page.map((m) =>
        m.client_id === clientId ? ({ ...m, status: 'sending' } as ThreadMessage) : m,
      ),
    );
    return { ...prev, pages };
  });
}

/**
 * Dedupe by client_id: a server row (real UUID id, status !== 'failed') wins
 * over an optimistic row (id starts with 'optimistic-'). Preserves order of
 * first appearance in the incoming list.
 */
export function dedupeByClientId(list: ThreadMessage[]): ThreadMessage[] {
  const byKey = new Map<string, ThreadMessage>();
  const order: string[] = [];

  const isOptimistic = (m: ThreadMessage) =>
    typeof m.id === 'string' && m.id.startsWith('optimistic-');

  for (const m of list) {
    const key = m.client_id ?? m.id;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, m);
      order.push(key);
      continue;
    }
    // Prefer the server row: not optimistic id, and not failed.
    const existingIsServer = !isOptimistic(existing) && existing.status !== 'failed';
    const incomingIsServer = !isOptimistic(m) && m.status !== 'failed';
    if (incomingIsServer && !existingIsServer) {
      byKey.set(key, m);
    }
    // else keep existing (server already there, or both optimistic - keep first)
  }

  return order.map((k) => byKey.get(k)!).filter(Boolean);
}
