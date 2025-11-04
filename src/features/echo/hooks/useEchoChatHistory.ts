import { useQuery } from '@tanstack/react-query';
import { fetchChatHistory, ChatItem } from '../data/history.fetchers';

export function useEchoChatHistory(opts?: { limit?: number; enabled?: boolean }) {
  const limit = opts?.limit ?? 20;
  return useQuery<ChatItem[]>({
    queryKey: ['echoChatHistory', limit],
    queryFn: () => fetchChatHistory(limit),
    enabled: opts?.enabled ?? true,
    staleTime: 30_000,
  });
}
