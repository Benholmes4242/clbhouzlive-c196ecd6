import React from 'react';
import AIChatOverlay from '@/components/ai-chat/AIChatOverlay';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';

type SwingCoachScreenProps = {
  onClose: () => void;
};

export function SwingCoachScreen({ onClose }: SwingCoachScreenProps) {
  return (
    <EchoConversationsProvider>
      <div className="h-full w-full -mx-4 -mb-6">
        <AIChatOverlay
          isOpen={true}
          onClose={onClose}
          paneMode
          layout="page"
          initialTab="swing"
        />
      </div>
    </EchoConversationsProvider>
  );
}
