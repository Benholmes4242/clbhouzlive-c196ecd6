/**
 * Phase 3 Perf: Split ModalContext into State and Dispatch contexts
 * Components that only read state don't re-render when setters are called
 */
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// ============================================================================
// STATE CONTEXT (read-only values)
// ============================================================================
interface ModalStateContextType {
  isCreateMomentModalOpen: boolean;
  shouldHideHeader: boolean;
}

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

// ============================================================================
// DISPATCH CONTEXT (setters only)
// ============================================================================
interface ModalDispatchContextType {
  setCreateMomentModalOpen: (open: boolean) => void;
}

const ModalDispatchContext = createContext<ModalDispatchContextType | undefined>(undefined);

// ============================================================================
// HOOKS
// ============================================================================

/** Use for components that only need to READ modal state (won't re-render on dispatch) */
export const useModalState = () => {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error('useModalState must be used within a ModalProvider');
  }
  return context;
};

/** Use for components that need to CONTROL modals (opening/closing) */
export const useModalDispatch = () => {
  const context = useContext(ModalDispatchContext);
  if (!context) {
    throw new Error('useModalDispatch must be used within a ModalProvider');
  }
  return context;
};

/** Legacy hook - combines both contexts for backward compatibility */
export const useModalContext = () => {
  const state = useModalState();
  const dispatch = useModalDispatch();
  return { ...state, ...dispatch };
};

// ============================================================================
// PROVIDER
// ============================================================================
interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isCreateMomentModalOpen, setIsCreateMomentModalOpen] = useState(false);

  const shouldHideHeader = isCreateMomentModalOpen;

  const setCreateMomentModalOpen = useCallback((open: boolean) => {
    setIsCreateMomentModalOpen(open);
  }, []);

  // Memoize state value - only changes when state changes
  const stateValue = useMemo<ModalStateContextType>(() => ({
    isCreateMomentModalOpen,
    shouldHideHeader,
  }), [isCreateMomentModalOpen, shouldHideHeader]);

  // Memoize dispatch value - stable reference (callbacks don't change)
  const dispatchValue = useMemo<ModalDispatchContextType>(() => ({
    setCreateMomentModalOpen,
  }), [setCreateMomentModalOpen]);

  return (
    <ModalStateContext.Provider value={stateValue}>
      <ModalDispatchContext.Provider value={dispatchValue}>
        {children}
      </ModalDispatchContext.Provider>
    </ModalStateContext.Provider>
  );
};