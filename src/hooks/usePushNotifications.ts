// Push notification system — being rebuilt
export function usePushNotifications() {
  return {
    state: 'unknown' as const,
    isLoading: false,
    enable: async () => false,
    disable: async () => false,
  };
}
