import React, { useState } from 'react';
import FloatingAIButton from './FloatingAIButton';
import AIChatOverlay from './AIChatOverlay';

const AIChat: React.FC = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <>
      <FloatingAIButton onClick={() => setIsOverlayOpen(true)} />
      <AIChatOverlay 
        isOpen={isOverlayOpen} 
        onClose={() => setIsOverlayOpen(false)} 
      />
    </>
  );
};

export default AIChat;