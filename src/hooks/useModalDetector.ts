import { useState, useEffect } from 'react';

const modalStates = new Map<string, boolean>();
const modalListeners = new Set<(isOpen: boolean) => void>();

// Generate unique ID for each modal
let modalIdCounter = 0;
const generateModalId = () => `modal-${++modalIdCounter}`;

// Check if any modal is open
const hasAnyModalOpen = () => Array.from(modalStates.values()).some(isOpen => isOpen);

// Notify all listeners
const notifyListeners = () => {
  const hasModalOpen = hasAnyModalOpen();
  modalListeners.forEach(listener => listener(hasModalOpen));
};

// Hook to register a modal
export const useModalState = (isOpen: boolean) => {
  const [modalId] = useState(generateModalId);

  useEffect(() => {
    modalStates.set(modalId, isOpen);
    notifyListeners();

    return () => {
      modalStates.delete(modalId);
      notifyListeners();
    };
  }, [modalId, isOpen]);
};

// Hook to detect if any modal is open
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