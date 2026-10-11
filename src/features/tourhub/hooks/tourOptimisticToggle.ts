import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Roll back only this id, never another player's concurrent successful write. */
export async function tourOptimisticToggle(
  client: QueryClient,
  key: QueryKey,
  id: string,
  write: (following: boolean) => Promise<void>,
): Promise<void> {
  await client.cancelQueries({ queryKey: key });
  const before = client.getQueryData<string[]>(key) ?? [];
  const wasOn = before.includes(id);
  const apply = (on: boolean) => client.setQueryData<string[]>(key, (ids = []) =>
    on ? [...new Set([...ids, id])] : ids.filter((value) => value !== id));
  apply(!wasOn);
  try {
    await write(!wasOn);
  } catch (error) {
    apply(wasOn);
    throw error;
  } finally {
    // The app's mount default does not refetch invalidated data. Keep our own
    // authoritative write/rollback in cache AND invalidate, without a stale read.
    await client.invalidateQueries({ queryKey: key, refetchType: 'none' });
    client.setQueryData<string[]>(key, (ids = []) => [...ids]);
  }
}