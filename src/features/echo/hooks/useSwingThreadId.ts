import { useQuery } from '@tanstack/react-query';

export function useSwingThreadId(swingId?: string, threadIdFromSwing?: string | null) {
  return useQuery({
    queryKey: ['swing-thread-id', swingId, threadIdFromSwing],
    enabled: !!swingId,
    queryFn: async (): Promise<string | null> => {
      // If the swing analysis already has a thread_id, use it
      if (threadIdFromSwing) return threadIdFromSwing;
      
      // Otherwise, no thread exists yet for this swing
      return null;
    },
  });
}
