import { useState, useEffect } from 'react';

let modalCount = 0;
const modalListeners = new Set<(isOpen: boolean) => void>();

// Global modal state tracker
export const registerModal = (isOpen: boolean) => {
  if (isOpen) {
    modalCount++;
  } else {
    modalCount = Math.max(0, modalCount - 1);
  }
  
  const hasModalOpen = modalCount > 0;
  modalListeners.forEach(listener => listener(hasModalOpen));
};

export const useModalDetector = () => {
  const [hasModalOpen, setHasModalOpen] = useState(false);

  useEffect(() => {
    const listener = (isOpen: boolean) => setHasModalOpen(isOpen);
    modalListeners.add(listener);
    
    return () => {
      modalListeners.delete(listener);
    };
  }, []);

  return { hasModalOpen };
};