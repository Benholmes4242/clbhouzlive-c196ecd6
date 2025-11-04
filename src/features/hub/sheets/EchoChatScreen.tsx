import React from 'react';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';

type EchoChatScreenProps = {
  onClose: () => void;
};

export function EchoChatScreen({ onClose }: EchoChatScreenProps) {
  return (
    <EchoConversationsProvider>
      <div className="h-full w-full -mx-4 -mb-6">
        <AIChatOverlay
          isOpen={true}
          onClose={onClose}
          paneMode
          layout="page"
          initialTab="chat"
        />
      </div>
    </EchoConversationsProvider>
  );
}
