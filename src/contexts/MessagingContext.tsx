import { createContext, useContext, ReactNode } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import type { UseMessagingReturn } from '@/hooks/useMessaging';

const MessagingContext = createContext<UseMessagingReturn | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const messaging = useMessaging();
  return (
    <MessagingContext.Provider value={messaging}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessagingContext(): UseMessagingReturn {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessagingContext must be used within MessagingProvider');
  return ctx;
}
