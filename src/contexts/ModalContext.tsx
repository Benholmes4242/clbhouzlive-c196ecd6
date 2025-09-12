import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isSnapModalOpen: boolean;
  isCreateMomentModalOpen: boolean;
  setSnapModalOpen: (open: boolean) => void;
  setCreateMomentModalOpen: (open: boolean) => void;
  shouldHideHeader: boolean;
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
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [isCreateMomentModalOpen, setIsCreateMomentModalOpen] = useState(false);

  const shouldHideHeader = isSnapModalOpen || isCreateMomentModalOpen;

  const setSnapModalOpen = (open: boolean) => {
    setIsSnapModalOpen(open);
  };

  const setCreateMomentModalOpen = (open: boolean) => {
    setIsCreateMomentModalOpen(open);
  };

  return (
    <ModalContext.Provider
      value={{
        isSnapModalOpen,
        isCreateMomentModalOpen,
        setSnapModalOpen,
        setCreateMomentModalOpen,
        shouldHideHeader,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};