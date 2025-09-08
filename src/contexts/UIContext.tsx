import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';

type Kind = 'open' | 'close' | null;

type UIContextValue = {
  modalTransition: { inProgress: boolean; kind: Kind };
  beginTransition: (kind: Exclude<Kind, null>) => void;
  endTransition: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inProgressRef = useRef(false);
  const kindRef = useRef<Kind>(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const beginTransition = useCallback((kind: Exclude<Kind, null>) => {
    inProgressRef.current = true;
    kindRef.current = kind;
    forceUpdate();
  }, []);

  const endTransition = useCallback(() => {
    inProgressRef.current = false;
    kindRef.current = null;
    forceUpdate();
  }, []);

  const value = useMemo<UIContextValue>(() => ({
    modalTransition: { inProgress: inProgressRef.current, kind: kindRef.current },
    beginTransition,
    endTransition,
  }), [beginTransition, endTransition, inProgressRef.current, kindRef.current]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};