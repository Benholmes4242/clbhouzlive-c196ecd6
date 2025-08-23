import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModalState {
  isAnyModalOpen: boolean;
  openModals: Set<string>;
  registerModal: (modalId: string) => void;
  unregisterModal: (modalId: string) => void;
}

const ModalContext = createContext<ModalState | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const registerModal = (modalId: string) => {
    setOpenModals(prev => new Set(prev).add(modalId));
  };

  const unregisterModal = (modalId: string) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(modalId);
      return newSet;
    });
  };

  const isAnyModalOpen = openModals.size > 0;

  return (
    <ModalContext.Provider value={{
      isAnyModalOpen,
      openModals,
      registerModal,
      unregisterModal
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModalDetector = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalDetector must be used within a ModalProvider');
  }
  return context;
};

export const useModalState = (modalId: string, isOpen: boolean) => {
  const { registerModal, unregisterModal } = useModalDetector();

  // Register/unregister modal when state changes
  useEffect(() => {
    if (isOpen) {
      registerModal(modalId);
    } else {
      unregisterModal(modalId);
    }

    // Cleanup: always unregister when component unmounts
    return () => unregisterModal(modalId);
  }, [isOpen, modalId, registerModal, unregisterModal]);
};