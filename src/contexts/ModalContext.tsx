import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModalContextType {
  isCreateMomentModalOpen: boolean;
  setCreateMomentModalOpen: (open: boolean) => void;
  shouldHideHeader: boolean;
  shouldHideBottomNav: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isCreateMomentModalOpen, setIsCreateMomentModalOpen] = useState(false);

  const shouldHideHeader = isCreateMomentModalOpen;
  const shouldHideBottomNav = isCreateMomentModalOpen;

  const setCreateMomentModalOpen = useCallback((open: boolean) => {
    setIsCreateMomentModalOpen(open);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isCreateMomentModalOpen,
        setCreateMomentModalOpen,
        shouldHideHeader,
        shouldHideBottomNav,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};