import React from 'react';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';

type RecentEchoScreenProps = {
  onClose: () => void;
};

export function RecentEchoScreen({ onClose }: RecentEchoScreenProps) {
  return (
    <EchoConversationsProvider>
      <div className="h-full w-full -mx-4 -mb-6">
        <AIChatHistory
          isOpen={true}
          onClose={onClose}
          onSelectMessage={(id) => console.log('Selected message:', id)}
          paneMode
          layout="page"
          defaultCategory="chat"
        />
      </div>
    </EchoConversationsProvider>
  );
}
