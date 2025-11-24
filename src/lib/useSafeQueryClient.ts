import { useQueryClient, QueryClient } from '@tanstack/react-query';

type UseSafeQueryClientOptions = {
  hookName?: string;
};

type SafeQueryClientResult = {
  queryClient: QueryClient | null;
  hasQueryClient: boolean;
};

export function useSafeQueryClient(
  options?: UseSafeQueryClientOptions
): SafeQueryClientResult {
  try {
    const qc = useQueryClient();
    return { queryClient: qc, hasQueryClient: true };
  } catch (err) {
    // Called outside of <QueryClientProvider>
    if (import.meta.env.DEV) {
      // Dev: loud + clear so we fix it
      // eslint-disable-next-line no-console
      console.error(
        `[React Query] useQueryClient() was called outside a <QueryClientProvider>${
          options?.hookName ? ` (from ${options.hookName})` : ''
        }.\n` +
          'This will break React Query. Please move this hook so it only runs under <QueryClientProvider>.'
      );
    } else {
      // Prod: quieter, but still log once
      // eslint-disable-next-line no-console
      console.warn(
        `[React Query] useQueryClient() used outside provider${
          options?.hookName ? ` (from ${options.hookName})` : ''
        }. Falling back to null QueryClient.`
      );
    }

    return { queryClient: null, hasQueryClient: false };
  }
}
