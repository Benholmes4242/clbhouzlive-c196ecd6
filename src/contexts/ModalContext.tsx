import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModalContextType {
  isCreateMomentModalOpen: boolean;
  setCreateMomentModalOpen: (open: boolean) => void;
  isCommentsDrawerOpen: boolean;
  setCommentsDrawerOpen: (open: boolean) => void;
  isMiniProfileDrawerOpen: boolean;
  setMiniProfileDrawerOpen: (open: boolean) => void;
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
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpenState] = useState(false);
  const [isMiniProfileDrawerOpen, setIsMiniProfileDrawerOpenState] = useState(false);

  const shouldHideHeader = isCreateMomentModalOpen;
  const shouldHideBottomNav = isCreateMomentModalOpen || isCommentsDrawerOpen || isMiniProfileDrawerOpen;

  const setCreateMomentModalOpen = useCallback((open: boolean) => {
    setIsCreateMomentModalOpen(open);
  }, []);

  const setCommentsDrawerOpen = useCallback((open: boolean) => {
    setIsCommentsDrawerOpenState(open);
  }, []);

  const setMiniProfileDrawerOpen = useCallback((open: boolean) => {
    setIsMiniProfileDrawerOpenState(open);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isCreateMomentModalOpen,
        setCreateMomentModalOpen,
        isCommentsDrawerOpen,
        setCommentsDrawerOpen,
        isMiniProfileDrawerOpen,
        setMiniProfileDrawerOpen,
        shouldHideHeader,
        shouldHideBottomNav,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};