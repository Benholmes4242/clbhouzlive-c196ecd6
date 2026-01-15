import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

type Kind = 'open' | 'close' | null;

interface ModalTransitionState {
  inProgress: boolean;
  kind: Kind;
}

type UIContextValue = {
  modalTransition: ModalTransitionState;
  beginTransition: (kind: Exclude<Kind, null>) => void;
  endTransition: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

type TransitionAction = 
  | { type: 'BEGIN'; kind: Exclude<Kind, null> }
  | { type: 'END' };

const transitionReducer = (state: ModalTransitionState, action: TransitionAction): ModalTransitionState => {
  switch (action.type) {
    case 'BEGIN':
      return { inProgress: true, kind: action.kind };
    case 'END':
      return { inProgress: false, kind: null };
    default:
      return state;
  }
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalTransition, dispatch] = useReducer(transitionReducer, { inProgress: false, kind: null });

  const beginTransition = useCallback((kind: Exclude<Kind, null>) => {
    dispatch({ type: 'BEGIN', kind });
  }, []);

  const endTransition = useCallback(() => {
    dispatch({ type: 'END' });
  }, []);

  // Now useMemo only depends on stable references (callbacks) and state from reducer
  const value = useMemo<UIContextValue>(() => ({
    modalTransition,
    beginTransition,
    endTransition,
  }), [modalTransition, beginTransition, endTransition]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};